import {
  type Context,
  type Span,
  context,
  createContextKey,
} from '@opentelemetry/api';

// Request-scoped identity; never put a user ID on shared provider resources.
export const telemetryUserKey = createContextKey('slate.telemetry.user');

export function userAttributes(userId?: string | null) {
  return userId ? { 'user.id': userId } : {};
}

export function requestUserAttributes(parent: Context = context.active()) {
  return userAttributes(
    parent.getValue(telemetryUserKey) as string | undefined,
  );
}

export function userSpanProcessor(getUserId: () => string | undefined) {
  return {
    onStart(span: Span) {
      span.setAttributes(userAttributes(getUserId()));
    },
    onEnd() {},
    async forceFlush() {},
    async shutdown() {},
  };
}
