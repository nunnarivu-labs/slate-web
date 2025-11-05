import { extractActionItemsPrompt } from '@/data/prompts/extract-action-items-prompt.ts';
import { intelligentTagsSuggestionPrompt } from '@/data/prompts/intelligent-tags-suggestion-prompt.ts';
import { summarizePrompt } from '@/data/prompts/summarize-prompt.ts';
import { auth } from '@clerk/tanstack-react-start/server';
import { GoogleGenAI, Type } from '@google/genai';
import { createServerFn } from '@tanstack/react-start';

export const summarize = createServerFn({ method: 'POST' })
  .inputValidator((data: { note: string }) => data)
  .handler(async ({ data }) => {
    const { userId } = await auth();

    if (!userId || userId === process.env.VITE_GUEST_USER_ID)
      throw new Error('AI features are not available to guest users');

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: data.note,
      config: { systemInstruction: summarizePrompt },
    });

    return response.text;
  });

export const extractActionItems = createServerFn({ method: 'POST' })
  .inputValidator((data: { note: string }) => data)
  .handler(async ({ data }) => {
    const { userId } = await auth();

    if (!userId || userId === process.env.VITE_GUEST_USER_ID)
      throw new Error('AI features are not available to guest users');

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: data.note,
      config: { systemInstruction: extractActionItemsPrompt },
    });

    return response.text;
  });

export const suggestTags = createServerFn({ method: 'POST' })
  .inputValidator((data: { note: string; tags: string[] }) => data)
  .handler(async ({ data }): Promise<{ tags: string[] }> => {
    const { userId } = await auth();

    if (!userId || userId === process.env.VITE_GUEST_USER_ID)
      throw new Error('AI features are not available to guest users');

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: JSON.stringify({
        note_content: data.note,
        existing_tags: data.tags,
      }),
      config: {
        systemInstruction: intelligentTagsSuggestionPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },
          },
        },
      },
    });

    return response.text ? JSON.parse(response.text) : { tags: [] };
  });
