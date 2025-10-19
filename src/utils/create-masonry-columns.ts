import { Note } from '@/types/note.ts';

export const createMasonryColumns = (
  notes: Note[],
  numColumns: number,
): Note[][] => {
  const columns: Note[][] = Array.from({ length: numColumns }, () => []);
  notes.forEach((note, index) => {
    columns[index % numColumns].push(note);
  });
  return columns;
};
