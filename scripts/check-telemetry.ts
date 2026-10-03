import { trace } from '@opentelemetry/api';

import { observeAi } from '../src/observability/ai.ts';
import { startLocalTelemetry } from './telemetry.ts';

// Exercise real exporters without calling the AI provider or reading any notes.
const sdk = startLocalTelemetry({
  ...process.env,
  OTEL_ENABLED: 'true',
} as Record<string, string>);
if (!sdk) throw new Error('Telemetry is disabled by OTEL_SDK_DISABLED.');

try {
  await trace
    .getTracer('slate.telemetry-check')
    .startActiveSpan('telemetry.check', async (span) => {
      try {
        const result = await observeAi(
          'summarize',
          async (recordUsage) => {
            recordUsage(
              { input_tokens: 10, output_tokens: 5 },
              { output_text: 'ok' },
            );
            return 'ok';
          },
          {
            input: { note: 'Synthetic note for telemetry verification.' },
            instructions: 'Synthetic summary instruction.',
          },
        );
        if (result !== 'ok')
          throw new Error('Successful operation result changed.');

        const failure = new Error('Synthetic telemetry check failure.');
        try {
          await observeAi('extract_action_items', async () => {
            throw failure;
          });
          throw new Error('Expected operation to reject.');
        } catch (error) {
          if (error !== failure) throw error;
        }
        console.log(`Telemetry check trace ID: ${span.spanContext().traceId}`);
      } finally {
        span.end();
      }
    });
} finally {
  await sdk.shutdown();
}
