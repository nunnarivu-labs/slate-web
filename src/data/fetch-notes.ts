import { FILE_PATH } from '@/data/config.ts';
import { Note } from '@/types/note.ts';
import { createServerFn } from '@tanstack/react-start';
import * as fs from 'node:fs';

export const fetchNotes = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Note[]> => {
    const data = await fs.promises.readFile(FILE_PATH, 'utf-8');
    return JSON.parse(data);
  },
);

export const fetchNoteById = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<Note> => {
    const notes = await fetchNotes();

    const note = notes.find((note) => note.id === data.id);

    if (!note) {
      throw new Error(`Note with ID ${data.id} is not found`);
    }

    return note;
  });
