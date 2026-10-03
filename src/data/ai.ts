import { extractActionItemsPrompt } from '@/data/prompts/extract-action-items-prompt.ts';
import { intelligentTagsSuggestionPrompt } from '@/data/prompts/intelligent-tags-suggestion-prompt.ts';
import { summarizePrompt } from '@/data/prompts/summarize-prompt.ts';
import { observeAi } from '@/observability/ai.ts';
import { createServerFn } from '@tanstack/react-start';
import { OpenAI } from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const suggestedTagsSchema = z.object({
  tags: z.array(z.string()),
});

export const summarize = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { note: string; length?: 'brief' | 'detailed' }) => data,
  )
  .handler(async ({ data }) =>
    observeAi('summarize', async (recordUsage) => {
      const baseURL = process.env.AI_API_BASE_URL;
      const apiKey = process.env.AI_API_KEY!;

      const client = baseURL
        ? new OpenAI({ baseURL, apiKey })
        : new OpenAI({ apiKey });

      const response = await client.responses.create({
        model: process.env.AI_MODEL!,
        input: data.note,
        instructions: summarizePrompt(data.length),
      });

      recordUsage(response.usage, response.model);
      return response.output_text;
    }),
  );

export const extractActionItems = createServerFn({ method: 'POST' })
  .inputValidator((data: { note: string }) => data)
  .handler(async ({ data }) =>
    observeAi('extract_action_items', async (recordUsage) => {
      const baseURL = process.env.AI_API_BASE_URL;
      const apiKey = process.env.AI_API_KEY!;

      const client = baseURL
        ? new OpenAI({ baseURL, apiKey })
        : new OpenAI({ apiKey });

      const response = await client.responses.create({
        model: process.env.AI_MODEL!,
        input: data.note,
        instructions: extractActionItemsPrompt,
      });

      recordUsage(response.usage, response.model);
      return response.output_text;
    }),
  );

export const suggestTags = createServerFn({ method: 'POST' })
  .inputValidator((data: { note: string; tags: string[] }) => data)
  .handler(async ({ data }): Promise<{ tags: string[] }> =>
    observeAi('suggest_tags', async (recordUsage) => {
      const baseURL = process.env.AI_API_BASE_URL;
      const apiKey = process.env.AI_API_KEY!;

      const client = baseURL
        ? new OpenAI({ baseURL, apiKey })
        : new OpenAI({ apiKey });

      const params = {
        model: process.env.AI_MODEL!,
        instructions: intelligentTagsSuggestionPrompt,
        input: JSON.stringify({
          note_content: data.note,
          existing_tags: data.tags,
        }),
        text: {
          format: zodTextFormat(suggestedTagsSchema, 'suggested_tags'),
        },
      };

      if (baseURL) {
        const response = await client.responses.create(params);
        recordUsage(response.usage, response.model);
        const result = response.output_text.match(/\[.*?]/);

        if (!result)
          throw new Error(
            'The model did not return a complete tag suggestion.',
          );

        return { tags: JSON.parse(result[0]) };
      } else {
        const response = await client.responses.parse(params);
        recordUsage(response.usage, response.model);

        if (!response.output_parsed)
          throw new Error(
            'The model did not return a complete tag suggestion.',
          );

        return response.output_parsed;
      }
    }),
  );
