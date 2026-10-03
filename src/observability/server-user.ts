import { context, trace } from '@opentelemetry/api';

import { telemetryUserKey, userAttributes } from './user';

type ClerkRequestContext = {
  auth?: () => { userId?: string | null } | Promise<{ userId?: string | null }>;
};

export async function withTelemetryUser<T>(
  requestContext: unknown,
  next: () => T | Promise<T>,
): Promise<T> {
  // Use Clerk's middleware-provided accessor. The public auth() helper needs
  // Start's AsyncLocalStorage, which isn't established at this pipeline stage.
  const clerkContext = requestContext as ClerkRequestContext | undefined;
  const identity = await clerkContext?.auth?.();
  const userId = identity?.userId;
  trace.getActiveSpan()?.setAttributes(userAttributes(userId));
  return context.with(
    context.active().setValue(telemetryUserKey, userId || undefined),
    next,
  );
}
