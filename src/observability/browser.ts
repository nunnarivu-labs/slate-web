import {
  type Attributes,
  SpanKind,
  SpanStatusCode,
  context,
  trace,
} from '@opentelemetry/api';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from '@opentelemetry/sdk-logs';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import {
  BatchSpanProcessor,
  StackContextManager,
  WebTracerProvider,
} from '@opentelemetry/sdk-trace-web';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

type BrowserTelemetry = ReturnType<typeof createBrowserTelemetry>;
const state = globalThis as typeof globalThis & {
  slateBrowserTelemetry?: BrowserTelemetry;
};

function createBrowserTelemetry() {
  const resource = resourceFromAttributes({
    'service.name': import.meta.env.VITE_SLATE_OTEL_SERVICE_NAME || 'slate',
    'slate.runtime': 'browser',
    'deployment.environment.name': 'local',
    'browser.user_agent': navigator.userAgent,
  });
  const endpoint = `${location.origin}/__otel/v1`;
  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({ url: `${endpoint}/traces` }),
        { scheduledDelayMillis: 1000 },
      ),
    ],
  });
  provider.register({ contextManager: new StackContextManager() });
  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({ url: `${endpoint}/logs` }),
        scheduledDelayMillis: 1000,
      }),
    ],
  });
  const meterProvider = new MeterProvider({
    resource,
    readers: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({ url: `${endpoint}/metrics` }),
        exportIntervalMillis: 5000,
      }),
    ],
  });
  const logger = loggerProvider.getLogger('slate.browser');
  const meter = meterProvider.getMeter('slate.browser');
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation({
        ignoreUrls: [
          /\/__otel\//,
          new RegExp(
            `^(?!${location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/)`,
          ),
        ],
        propagateTraceHeaderCorsUrls: [location.origin],
        clearTimingResources: false,
      }),
    ],
  });
  const errors = meter.createCounter('slate.browser.errors');
  const reportError = (error: unknown, source: string) => {
    const exception = error instanceof Error ? error : new Error(String(error));
    const span = provider
      .getTracer('slate.browser')
      .startSpan('browser.error', {
        attributes: { 'error.source': source, 'url.full': location.href },
      });
    span.recordException(exception);
    span.setStatus({ code: SpanStatusCode.ERROR, message: exception.message });
    logger.emit({
      context: trace.setSpan(context.active(), span),
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: exception.message,
      attributes: {
        'error.source': source,
        'exception.stacktrace': exception.stack ?? '',
        'url.full': location.href,
      },
    });
    errors.add(1, { source });
    span.end();
  };
  window.addEventListener('error', (event) =>
    reportError(
      event.error ?? event.message ?? 'Resource load failed',
      'window.error',
    ),
  );
  window.addEventListener('unhandledrejection', (event) =>
    reportError(event.reason, 'unhandledrejection'),
  );
  const vital = (metric: {
    name: string;
    value: number;
    rating: string;
    id: string;
  }) => {
    meter
      .createHistogram(`slate.browser.web_vital.${metric.name.toLowerCase()}`, {
        unit: metric.name === 'CLS' ? '1' : 'ms',
      })
      .record(metric.value, { rating: metric.rating });
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      body: 'Web vital',
      attributes: {
        'vital.name': metric.name,
        'vital.value': metric.value,
        'vital.rating': metric.rating,
        'vital.id': metric.id,
        'url.full': location.href,
      },
    });
  };
  [onCLS, onFCP, onINP, onLCP, onTTFB].forEach((register) =>
    register(vital, { reportAllChanges: true }),
  );
  const flush = () =>
    Promise.allSettled([
      provider.forceFlush(),
      loggerProvider.forceFlush(),
      meterProvider.forceFlush(),
    ]);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
  window.addEventListener('pagehide', () => void flush());
  return { provider, logger, meter, reportError, flush };
}

export function startBrowserTelemetry() {
  if (
    typeof window === 'undefined' ||
    !import.meta.env.DEV ||
    import.meta.env.VITE_SLATE_TELEMETRY_ENABLED === 'false'
  )
    return;
  return (state.slateBrowserTelemetry ??= createBrowserTelemetry());
}

export function browserLog(
  body: string,
  attributes: Attributes = {},
  error = false,
) {
  state.slateBrowserTelemetry?.logger.emit({
    body,
    attributes,
    severityNumber: error ? SeverityNumber.ERROR : SeverityNumber.INFO,
    severityText: error ? 'ERROR' : 'INFO',
  });
}

export function beginBrowserOperation(
  name: string,
  attributes: Attributes = {},
) {
  const telemetry = state.slateBrowserTelemetry;
  if (!telemetry)
    return {
      finish: (_outcome: string, _result?: unknown, _error?: unknown) => {},
    };
  const span = telemetry.provider
    .getTracer('slate.browser')
    .startSpan(name, { kind: SpanKind.CLIENT, attributes });
  const started = performance.now();
  let ended = false;
  return {
    span,
    finish(outcome: string, result?: unknown, error?: unknown) {
      if (ended) return;
      ended = true;
      const seconds = (performance.now() - started) / 1000;
      const details: Attributes = {
        ...attributes,
        outcome,
        'duration.seconds': seconds,
      };
      if (result !== undefined)
        details['operation.result'] = JSON.stringify(result);
      if (error !== undefined) {
        const exception =
          error instanceof Error ? error : new Error(String(error));
        span.recordException(exception);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: exception.message,
        });
        details['exception.message'] = exception.message;
        details['exception.stacktrace'] = exception.stack ?? '';
      }
      span.setAttributes(details);
      const labels = {
        operation: name,
        outcome,
        ...(attributes['convex.function']
          ? { function: attributes['convex.function'] }
          : {}),
      };
      telemetry.meter.createCounter('slate.browser.operations').add(1, labels);
      telemetry.meter
        .createHistogram('slate.browser.operation.duration', { unit: 's' })
        .record(seconds, labels);
      telemetry.logger.emit({
        context: trace.setSpan(context.active(), span),
        body: name,
        attributes: details,
        severityNumber:
          error === undefined ? SeverityNumber.INFO : SeverityNumber.ERROR,
      });
      span.end();
    },
  };
}

export async function observeBrowser<T>(
  name: string,
  run: () => Promise<T>,
  attributes: Attributes = {},
): Promise<T> {
  const operation = beginBrowserOperation(name, attributes);
  const execute = async () => {
    try {
      const result = await run();
      operation.finish('success', result);
      return result;
    } catch (error) {
      operation.finish('error', undefined, error);
      throw error;
    }
  };
  return operation.span
    ? context.with(trace.setSpan(context.active(), operation.span), execute)
    : execute();
}
