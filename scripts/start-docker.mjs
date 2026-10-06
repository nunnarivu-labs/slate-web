import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const children = new Set();
let stopping = false;
let lgtmStarted = false;
const lgtmContainer = 'grafana-otel-lgtm';

function run(command, args, capture = false) {
  const child = spawn(command, args, {
    cwd,
    stdio: capture ? 'pipe' : 'inherit',
    detached: true,
  });
  child.output = '';
  if (capture) {
    child.stdout.on('data', (chunk) => {
      child.output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      child.output += chunk;
    });
  }
  children.add(child);
  child.done = new Promise((resolve) => {
    child.once('error', (error) => {
      children.delete(child);
      console.error(`${command}: ${error.message}`);
      resolve(1);
    });
    child.once('exit', (code) => {
      children.delete(child);
      resolve(code ?? 1);
    });
  });
  return child;
}

async function startLgtm() {
  const inspect = run(
    'docker',
    [
      'ps',
      '-a',
      '--filter',
      `name=^/${lgtmContainer}$`,
      '--format',
      '{{.State}}',
    ],
    true,
  );
  if ((await inspect.done) !== 0)
    throw new Error(inspect.output || 'Unable to inspect LGTM container');
  if (stopping) return;
  const status = inspect.output.trim();
  if (status !== 'running') {
    // Reuse existing containers: recreating one could discard its dashboards.
    lgtmStarted = true;
    const args = status
      ? ['start', lgtmContainer]
      : [
          'run',
          '-d',
          '--name',
          lgtmContainer,
          '-p',
          '3000:3000',
          '-p',
          '3200:3200',
          '-p',
          '4040:4040',
          '-p',
          '4317:4317',
          '-p',
          '4318:4318',
          '-p',
          '9090:9090',
          '-v',
          'slate-lgtm-data:/data',
          'grafana/otel-lgtm:latest',
        ];
    if ((await run('docker', args).done) !== 0)
      throw new Error('Unable to start LGTM');
  }
  const deadline = Date.now() + 120_000;
  while (!stopping && Date.now() < deadline) {
    const health = run(
      'docker',
      [
        'inspect',
        '--format',
        '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}',
        lgtmContainer,
      ],
      true,
    );
    if ((await health.done) !== 0)
      throw new Error(health.output || 'Unable to inspect LGTM readiness');
    const state = health.output.trim();
    if (state === 'running healthy') {
      console.log('LGTM ready: http://localhost:3000');
      return;
    }
    if (!state.startsWith('running'))
      throw new Error(`LGTM stopped during startup: ${state}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!stopping)
    throw new Error(
      'LGTM did not become healthy within 120 seconds; check docker logs grafana-otel-lgtm',
    );
}

function signalGroup(child, signal) {
  if (!child.pid) return false;
  try {
    process.kill(-child.pid, signal);
    return true;
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
    return false;
  }
}

async function shutdown(code) {
  if (stopping) return;
  stopping = true;
  console.log('\nStopping Docker services…');
  for (const child of children) signalGroup(child, 'SIGTERM');

  let timeout;
  await Promise.race([
    Promise.all([...children].map((child) => child.done)),
    new Promise((resolve) => {
      timeout = setTimeout(() => {
        for (const child of children) signalGroup(child, 'SIGKILL');
        resolve();
      }, 5000);
    }),
  ]);
  clearTimeout(timeout);

  // Keep containers and the named data volume for the next run.
  const docker = run('docker', ['compose', 'stop']);
  let stopCode = await docker.done;
  if (lgtmStarted) {
    const lgtmStopCode = await run('docker', ['stop', lgtmContainer]).done;
    stopCode ||= lgtmStopCode;
  }
  process.exit(code || stopCode);
}

process.on('SIGINT', () => void shutdown(130));
process.on('SIGTERM', () => void shutdown(143));

console.log('Starting Docker services and waiting for readiness…');
const docker = run('docker', ['compose', 'up', '--wait']);
const dockerCode = await docker.done;

if (!stopping) {
  if (dockerCode !== 0) {
    await shutdown(dockerCode);
  } else {
    try {
      console.log('Starting LGTM and waiting for readiness…');
      await startLgtm();
    } catch (error) {
      console.error(error.message);
      await shutdown(1);
    }
    if (!stopping) {
      console.log('Docker services are ready. Containers will keep running.');
    }
  }
}
