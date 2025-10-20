import { writeNotes } from '@/data/config.ts';
import { fetchAllNotes } from '@/data/fetch-notes.ts';
import { Note } from '@/types/note.ts';
import { createServerFn } from '@tanstack/react-start';

export const saveNote = createServerFn({ method: 'POST' })
  .inputValidator((data: { note: Note }) => data)
  .handler(async ({ data }) => {
    const { note } = data;

    const notes = await fetchAllNotes();

    const noteIndex = notes.findIndex((n) => n.id === note.id);

    if (noteIndex !== -1) {
      notes[noteIndex] = note;
    } else {
      notes.unshift(note);
    }

    await writeNotes(notes);
  });
