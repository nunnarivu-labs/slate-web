import { Note } from '@/types/note.ts';
import { createServerFn } from '@tanstack/react-start';
import * as fs from 'node:fs';

export const fetchNotes = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Note[]> => {
    const data = await fs.promises.readFile('notes.json', 'utf-8');
    return JSON.parse(data);
  },
);
