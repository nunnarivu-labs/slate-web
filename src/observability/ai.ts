import {
  type Attributes,
  SpanStatusCode,
  metrics,
  trace,
} from '@opentelemetry/api';
import { SeverityNumber, logs } from '@opentelemetry/api-logs';

import { requestUserAttributes } from './user.ts';

type Operation = 'summarize' | 'extract_action_items' | 'suggest_tags';
type Usage = { input_tokens: number; output_tokens: number };

export async function observeAi<T>(
  operation: Operation,
  run: (recordUsage: (usage?: Usage, model?: string) => void) => Promise<T>,
): Promise<T> {
  const identity = requestUserAttributes();
  const attributes = {
    'ai.operation': operation,
    'gen_ai.request.model': process.env.AI_MODEL || 'unknown',
  };
  // Resolve instruments at call time, after the local SDK has initialized.
  const meter = metrics.getMeter('slate.ai');
  const duration = meter.createHistogram('slate.ai.duration', { unit: 's' });
  const requests = meter.createCounter('slate.ai.requests');
  const tokens = meter.createCounter('slate.ai.tokens', { unit: '{token}' });

  return trace.getTracer('slate.ai').startActiveSpan(
    `ai.${operation}`,
    {
      attributes: { ...attributes, ...identity },
    },
    async (span) => {
      const started = performance.now();
      let outcome = 'success';
      const details: Attributes = { 'gen_ai.usage.available': false };
      const recordUsage = (usage?: Usage, model?: string) => {
        if (model) {
          details['gen_ai.response.model'] = model;
          span.setAttribute('gen_ai.response.model', model);
        }
        if (!usage) return;
        details['gen_ai.usage.available'] = true;
        details['gen_ai.usage.input_tokens'] = usage.input_tokens;
        details['gen_ai.usage.output_tokens'] = usage.output_tokens;
        span.setAttributes(details);
        tokens.add(usage.input_tokens, {
          ...attributes,
          'token.type': 'input',
        });
        tokens.add(usage.output_tokens, {
          ...attributes,
          'token.type': 'output',
        });
      };
      try {
        const result = await run(recordUsage);
        if (span.isRecording()) {
          details['ai.result'] = JSON.stringify(result) ?? String(result);
          span.setAttribute('ai.result', details['ai.result']);
        }
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        outcome = 'error';
        const exception =
          error instanceof Error ? error : new Error(String(error));
        span.recordException(exception);
        span.setAttribute('error.type', exception.name);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: exception.message,
        });
        details['exception.message'] = exception.message;
        details['exception.stacktrace'] = exception.stack ?? '';
        throw error;
      } finally {
        const elapsed = (performance.now() - started) / 1000;
        const completed = { ...attributes, outcome };
        duration.record(elapsed, completed);
        requests.add(1, completed);
        logs.getLogger('slate.ai').emit({
          severityNumber:
            outcome === 'error' ? SeverityNumber.ERROR : SeverityNumber.INFO,
          severityText: outcome === 'error' ? 'ERROR' : 'INFO',
          body: `AI operation ${outcome}`,
          attributes: {
            ...completed,
            ...details,
            ...identity,
            'duration.seconds': elapsed,
          },
        });
        span.end();
      }
    },
  );
}
