// @vitest-environment node
import { type Attributes, type Span, trace } from '@opentelemetry/api';
import {
  InMemoryLogRecordExporter,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import {
  AggregationTemporality,
  InMemoryMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-web';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { observeAi } from './ai';
import { withTelemetryUser } from './server-user';
import { userAttributes, userSpanProcessor } from './user';

const spans = new InMemorySpanExporter();
const logs = new InMemoryLogRecordExporter();
const metrics = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
const reader = new PeriodicExportingMetricReader({
  exporter: metrics,
  exportIntervalMillis: 60000,
});
const logProcessor = new SimpleLogRecordProcessor({ exporter: logs });
const sdk = new NodeSDK({
  serviceName: 'slate-test',
  spanProcessors: [new SimpleSpanProcessor(spans)],
  logRecordProcessors: [logProcessor],
  metricReader: reader,
});
beforeAll(() => sdk.start());
afterAll(() => sdk.shutdown());

describe('telemetry user identity', () => {
  it('isolates overlapping AI requests and excludes user IDs from metrics', async () => {
    let resumeFirst!: () => void;
    const waitForFirst = new Promise<void>((resolve) => {
      resumeFirst = resolve;
    });
    const first = withTelemetryUser(
      { auth: () => ({ userId: 'user_first' }) },
      () =>
        observeAi('summarize', async (usage) => {
          await waitForFirst;
          usage({ input_tokens: 10, output_tokens: 5 });
          return 'first';
        }),
    );
    const second = withTelemetryUser(
      { auth: () => ({ userId: 'user_second' }) },
      () =>
        observeAi('suggest_tags', async (usage) => {
          usage({ input_tokens: 20, output_tokens: 6 });
          return 'second';
        }),
    );
    expect(await second).toBe('second');
    resumeFirst();
    expect(await first).toBe('first');
    await logProcessor.forceFlush();
    const finished = spans.getFinishedSpans();
    expect(
      finished.find((span) => span.name === 'ai.summarize')?.attributes[
        'user.id'
      ],
    ).toBe('user_first');
    expect(
      finished.find((span) => span.name === 'ai.suggest_tags')?.attributes[
        'user.id'
      ],
    ).toBe('user_second');
    const records = logs.getFinishedLogRecords();
    expect(
      records.find((r) => r.attributes['ai.operation'] === 'summarize')
        ?.attributes,
    ).toMatchObject({
      'gen_ai.usage.available': true,
      'gen_ai.usage.input_tokens': 10,
      'gen_ai.usage.output_tokens': 5,
    });
    expect(
      records.find((r) => r.attributes['ai.operation'] === 'summarize')
        ?.attributes['user.id'],
    ).toBe('user_first');
    expect(
      records.find((r) => r.attributes['ai.operation'] === 'suggest_tags')
        ?.attributes['user.id'],
    ).toBe('user_second');
    await reader.forceFlush();
    const points = metrics
      .getMetrics()
      .flatMap((m) =>
        m.scopeMetrics.flatMap((s) =>
          s.metrics.flatMap((metric) =>
            metric.dataPoints.map((point) => point.attributes),
          ),
        ),
      );
    expect(points.length).toBeGreaterThan(0);
    expect(points.every((point) => !('user.id' in point))).toBe(true);
  });

  it('keeps anonymous requests anonymous and preserves failures', async () => {
    const failure = new Error('expected failure');
    await expect(
      withTelemetryUser({ auth: () => ({ userId: null }) }, () =>
        observeAi('extract_action_items', async () => {
          throw failure;
        }),
      ),
    ).rejects.toBe(failure);
    await logProcessor.forceFlush();
    const record = logs
      .getFinishedLogRecords()
      .find((r) => r.attributes['ai.operation'] === 'extract_action_items');
    expect(record).toBeDefined();
    expect(record?.attributes).not.toHaveProperty('user.id');
    expect(record?.attributes['gen_ai.usage.available']).toBe(false);
    expect(record?.attributes).not.toHaveProperty('gen_ai.usage.input_tokens');
    expect(record?.attributes).not.toHaveProperty('gen_ai.usage.output_tokens');
    expect(userAttributes(null)).toEqual({});
  });

  it('emits one completion record with usage even when result processing fails', async () => {
    const start = logs.getFinishedLogRecords().length;
    const failure = new Error('result processing failed');
    await expect(
      observeAi('suggest_tags', async (recordUsage) => {
        recordUsage({ input_tokens: 123, output_tokens: 45 }, 'provider-model');
        throw failure;
      }),
    ).rejects.toBe(failure);
    await logProcessor.forceFlush();
    const records = logs.getFinishedLogRecords().slice(start);
    expect(records).toHaveLength(1);
    expect(records[0].attributes).toMatchObject({
      'ai.operation': 'suggest_tags',
      'gen_ai.request.model': process.env.AI_MODEL || 'unknown',
      'gen_ai.response.model': 'provider-model',
      'gen_ai.usage.available': true,
      'gen_ai.usage.input_tokens': 123,
      'gen_ai.usage.output_tokens': 45,
      outcome: 'error',
    });
    for (const key of [
      'gen_ai.input',
      'gen_ai.instructions',
      'gen_ai.response',
    ]) {
      expect(records[0].attributes).not.toHaveProperty(key);
      expect(spans.getFinishedSpans().at(-1)?.attributes).not.toHaveProperty(
        key,
      );
    }
  });

  it('uses Clerk middleware context before Start context exists', async () => {
    await trace
      .getTracer('slate.server')
      .startActiveSpan('server.router', async (span) => {
        try {
          await withTelemetryUser(
            { auth: () => ({ userId: 'user_request' }) },
            async () => 'ok',
          );
        } finally {
          span.end();
        }
      });
    expect(
      spans.getFinishedSpans().find((span) => span.name === 'server.router')
        ?.attributes['user.id'],
    ).toBe('user_request');
    // Middleware without Clerk context must still allow anonymous requests.
    await expect(
      withTelemetryUser(undefined, async () => 'anonymous'),
    ).resolves.toBe('anonymous');
  });

  it('snapshots browser identity when a span starts and clears it for sign-out', () => {
    let userId: string | undefined = 'user_first';
    const processor = userSpanProcessor(() => userId);
    const firstAttributes = {};
    const secondAttributes = {};
    processor.onStart({
      setAttributes: (attrs: Attributes) =>
        Object.assign(firstAttributes, attrs),
    } as unknown as Span);
    userId = undefined;
    processor.onStart({
      setAttributes: (attrs: Attributes) =>
        Object.assign(secondAttributes, attrs),
    } as unknown as Span);
    expect(firstAttributes).toEqual({ 'user.id': 'user_first' });
    expect(secondAttributes).toEqual({});
  });
});
