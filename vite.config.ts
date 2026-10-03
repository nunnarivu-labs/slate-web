import netlify from '@netlify/vite-plugin-tanstack-start';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import { defineConfig, loadEnv } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

import { startLocalTelemetry } from './scripts/telemetry';

const config = defineConfig(({ command, mode, isPreview }) => {
  const telemetryEnv = {
    ...loadEnv(mode, process.cwd(), ['SLATE_OTEL_', 'OTEL_']),
    ...process.env,
  } as Record<string, string>;
  if (command === 'serve' && !isPreview) {
    startLocalTelemetry(telemetryEnv);
  }
  return {
    define: {
      'import.meta.env.VITE_SLATE_OTEL_SERVICE_NAME': JSON.stringify(
        telemetryEnv.SLATE_OTEL_SERVICE_NAME || 'slate',
      ),
      'import.meta.env.VITE_SLATE_TELEMETRY_ENABLED': JSON.stringify(
        telemetryEnv.OTEL_ENABLED !== 'false' &&
          telemetryEnv.OTEL_SDK_DISABLED !== 'true'
          ? 'true'
          : 'false',
      ),
    },
    server: {
      proxy: {
        '/__otel/v1': {
          target: telemetryEnv.SLATE_OTEL_ENDPOINT || 'http://localhost:4318',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/__otel/, ''),
        },
      },
    },
    plugins: [
      {
        name: 'slate-browser-telemetry-check',
        apply: 'serve',
        configureServer(server) {
          server.middlewares.use(async (request, response, next) => {
            if (request.url !== '/__telemetry-check') return next();
            try {
              const html = await readFile(
                new URL(
                  './scripts/browser-telemetry-check.html',
                  import.meta.url,
                ),
                'utf8',
              );
              response.setHeader('Content-Type', 'text/html');
              response.end(await server.transformIndexHtml(request.url, html));
            } catch (error) {
              next(error as Error);
            }
          });
        },
      },
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart(),
      // Netlify's local Edge Functions runtime currently passes a Deno flag that
      // is no longer supported by the installed Deno version. TanStack Start
      // server functions continue to run through Vite, so only disable that
      // optional Netlify emulation during local development.
      netlify({
        dev: {
          edgeFunctions: {
            enabled: false,
          },
        },
      }),
      viteReact(),
    ],
  };
});

export default config;
