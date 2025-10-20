import { FILE_PATH } from '@/data/config.ts';
import { NoteCategory } from '@/types/note-category.ts';
import { Note } from '@/types/note.ts';
import { createServerFn } from '@tanstack/react-start';
import * as fs from 'node:fs';

export const fetchAllNotes = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Note[]> => {
    const data = await fs.promises.readFile(FILE_PATH, 'utf-8');
    return JSON.parse(data);
  },
);

export const fetchNotes = createServerFn({ method: 'GET' })
  .inputValidator((data: { category: NoteCategory }) => data)
  .handler(
    async ({ data }): Promise<Note[]> =>
      (await fetchAllNotes()).filter((note) => note.category === data.category),
  );

export const fetchNoteById = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<Note> => {
    const notes = await fetchAllNotes();

    const note = notes.find((note) => note.id === data.id);

    if (!note) {
      throw new Error(`Note with ID ${data.id} is not found`);
    }

    return note;
  });
