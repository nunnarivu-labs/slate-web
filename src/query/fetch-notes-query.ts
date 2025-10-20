import { fetchNotes } from '@/data/fetch-notes.ts';
import { NoteCategory } from '@/utils/note-categoty-params.ts';
import { queryOptions } from '@tanstack/react-query';

export const getFetchNotesQueryKey = (category: NoteCategory) => [
  'notes',
  category,
];

export const getFetchNotesQuery = (category: NoteCategory) =>
  queryOptions({
    queryKey: getFetchNotesQueryKey(category),
    queryFn: fetchNotes,
  });
