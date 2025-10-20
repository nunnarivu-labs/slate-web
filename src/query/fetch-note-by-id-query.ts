import { fetchNoteById } from '@/data/fetch-notes.ts';
import { queryOptions } from '@tanstack/react-query';

export const getFetchNoteByIdQueryKey = (id: string) => ['note', id];

export const getFetchNoteByIdQuery = (id: string) =>
  queryOptions({
    queryKey: getFetchNoteByIdQueryKey(id),
    queryFn: () => fetchNoteById({ data: { id } }),
  });
