import { extractActionItemsPrompt } from '@/data/prompts/extract-action-items-prompt.ts';
import { summarizePrompt } from '@/data/prompts/summarize-prompt.ts';
import { GoogleGenAI } from '@google/genai';
import { createServerFn } from '@tanstack/react-start';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const summarize = createServerFn({ method: 'POST' })
  .inputValidator((data: { note: string }) => data)
  .handler(async ({ data }) => {
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: data.note,
      config: { systemInstruction: extractActionItemsPrompt },
    });

    return response.text;
  });
