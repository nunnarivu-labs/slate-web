import { SpanStatusCode, metrics, trace } from '@opentelemetry/api';
import { SeverityNumber, logs } from '@opentelemetry/api-logs';

type Operation = 'summarize' | 'extract_action_items' | 'suggest_tags';
type Usage = { input_tokens: number; output_tokens: number };

export async function observeAi<T>(
  operation: Operation,
  run: (recordUsage: (usage?: Usage, response?: unknown) => void) => Promise<T>,
  request?: { input: unknown; instructions: string },
): Promise<T> {
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
      attributes,
    },
    async (span) => {
      const started = performance.now();
      let outcome = 'success';
      const details: Record<string, string> = {};
      if (span.isRecording() && request) {
        details['gen_ai.input'] = JSON.stringify(request.input);
        details['gen_ai.instructions'] = request.instructions;
        span.setAttributes(details);
      }
      const recordUsage = (usage?: Usage, response?: unknown) => {
        if (span.isRecording() && response !== undefined) {
          details['gen_ai.response'] = JSON.stringify(response);
          span.setAttribute('gen_ai.response', details['gen_ai.response']);
        }
        if (!usage) return;
        span.setAttributes({
          'gen_ai.usage.input_tokens': usage.input_tokens,
          'gen_ai.usage.output_tokens': usage.output_tokens,
        });
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
          attributes: { ...completed, ...details, 'duration.seconds': elapsed },
        });
        span.end();
      }
    },
  );
}
