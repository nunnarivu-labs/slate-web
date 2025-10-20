import { writeNotes } from '@/data/config.ts';
import { fetchAllNotes } from '@/data/fetch-notes.ts';
import { createServerFn } from '@tanstack/react-start';

export const deleteNoteEntry = createServerFn()
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }) => {
    const notes = await fetchAllNotes();

    await writeNotes(notes.filter((note) => note.id !== id));
  });
