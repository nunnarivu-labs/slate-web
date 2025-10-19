import { FILE_PATH } from '@/data/config.ts';
import { fetchNotes } from '@/data/fetch-notes.ts';
import { Note } from '@/types/note.ts';
import { createServerFn } from '@tanstack/react-start';
import fs from 'node:fs';

export const saveNote = createServerFn({ method: 'POST' })
  .inputValidator((data: { note: Note }) => data)
  .handler(async ({ data }) => {
    const { note } = data;

    const notes = await fetchNotes();

    const noteIndex = notes.findIndex((n) => n.id === note.id);

    if (noteIndex !== -1) {
      notes[noteIndex] = note;
    } else {
      notes.unshift(note);
    }

    await fs.promises.writeFile(FILE_PATH, JSON.stringify(notes), 'utf-8');
  });
