import { clerkMiddleware } from '@clerk/tanstack-react-start/server';
import {
  SpanKind,
  SpanStatusCode,
  context,
  propagation,
  trace,
} from '@opentelemetry/api';
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start';

const telemetryMiddleware = createMiddleware().server(
  async ({ request, handlerType, next }) => {
    const parent = propagation.extract(context.active(), request.headers, {
      keys: (headers) => [...headers.keys()],
      get: (headers, key) => headers.get(key) ?? undefined,
    });
    return trace.getTracer('slate.server').startActiveSpan(
      `server.${handlerType}`,
      {
        kind: SpanKind.SERVER,
        attributes: {
          'http.request.method': request.method,
          'url.full': request.url,
        },
      },
      parent,
      async (span) => {
        try {
          const result = await next();
          span.setAttribute(
            'http.response.status_code',
            result.response.status,
          );
          if (result.response.status >= 500)
            span.setStatus({ code: SpanStatusCode.ERROR });
          return result;
        } catch (error) {
          span.recordException(
            error instanceof Error ? error : new Error(String(error)),
          );
          span.setStatus({ code: SpanStatusCode.ERROR });
          span.setAttribute('error.type', 'server_request_failed');
          throw error;
        } finally {
          span.end();
        }
      },
    );
  },
);

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
});

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [telemetryMiddleware, clerkMiddleware(), csrfMiddleware],
  };
});
