import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';

// Keep one provider across Vite config reloads. The SDK stays out of app bundles.
const state = globalThis as typeof globalThis & { slateTelemetry?: NodeSDK };

export function startLocalTelemetry(env: Record<string, string>) {
  if (env.OTEL_ENABLED === 'false' || env.OTEL_SDK_DISABLED === 'true') return;
  if (state.slateTelemetry) return state.slateTelemetry;

  // IDEs and dev tools may inject their own OTEL_* destination and service.
  // Use app-specific settings so Slate always targets its local LGTM stack.
  const endpoint = (env.SLATE_OTEL_ENDPOINT || 'http://localhost:4318').replace(
    /\/$/,
    '',
  );
  const serviceName = env.SLATE_OTEL_SERVICE_NAME || 'slate';
  const sdk = new NodeSDK({
    // NodeSDK applies this after environment resource detection, which can
    // otherwise overwrite resource.service.name with inherited OTEL settings.
    serviceName,
    resource: resourceFromAttributes({
      'service.name': serviceName,
      'slate.runtime': 'server',
      'deployment.environment.name': 'local',
    }),
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({ url: `${endpoint}/v1/metrics` }),
        exportIntervalMillis: 5000,
      }),
    ],
    logRecordProcessors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({ url: `${endpoint}/v1/logs` }),
      }),
    ],
  });
  sdk.start();
  // Keep providers alive across Vite server/config reloads.
  process.once('SIGINT', () => void sdk.shutdown());
  process.once('SIGTERM', () => void sdk.shutdown());
  state.slateTelemetry = sdk;
  console.info(
    `[telemetry] ${serviceName} → ${endpoint} (traces, metrics, logs)`,
  );
  return sdk;
}
