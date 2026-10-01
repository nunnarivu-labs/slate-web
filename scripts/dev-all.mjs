import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const cwd = fileURLToPath(new URL('..', import.meta.url))
const children = new Set()
let stopping = false

function run(command, args) {
  const child = spawn(command, args, { cwd, stdio: 'inherit', detached: true })
  children.add(child)
  child.done = new Promise((resolve) => {
    child.once('error', (error) => {
      console.error(`${command}: ${error.message}`)
      resolve(1)
    })
    child.once('exit', (code) => resolve(code ?? 1))
  })
  return child
}

function signalGroup(child, signal) {
  if (!child.pid) return false
  try {
    process.kill(-child.pid, signal)
    return true
  } catch (error) {
    if (error.code !== 'ESRCH') throw error
    return false
  }
}

async function shutdown(code) {
  if (stopping) return
  stopping = true
  console.log('\nStopping local development services…')
  for (const child of children) signalGroup(child, 'SIGTERM')

  // Target whole process groups so npm's Convex/Vite descendants also stop.
  let timeout
  await Promise.race([
    Promise.all([...children].map((child) => child.done)),
    new Promise((resolve) => {
      timeout = setTimeout(() => {
        for (const child of children) signalGroup(child, 'SIGKILL')
        resolve()
      }, 5000)
    }),
  ])
  clearTimeout(timeout)

  // Keep containers and the named data volume for the next run.
  const docker = run('docker', ['compose', 'stop'])
  const stopCode = await docker.done
  process.exit(code || stopCode)
}

process.on('SIGINT', () => void shutdown(130))
process.on('SIGTERM', () => void shutdown(143))

console.log('Starting Docker services and waiting for readiness…')
const docker = run('docker', ['compose', 'up', '--wait'])
const dockerCode = await docker.done

if (!stopping) {
  if (dockerCode !== 0) {
    await shutdown(dockerCode)
  } else {
    console.log('Starting Convex and Vite. Press Ctrl+C to stop everything.')
    const convex = run('npm', ['run', 'convex'])
    const vite = run('npm', ['run', 'dev'])
    const code = await Promise.race([convex.done, vite.done])
    await shutdown(code)
  }
}
