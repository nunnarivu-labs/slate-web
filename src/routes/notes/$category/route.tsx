import { NotesApp } from '@/components/notes-app.tsx';
import { getFetchNotesQuery } from '@/query/fetch-notes-query.ts';
import {
  NoteCategory,
  isValidNoteCategory,
} from '@/utils/note-categoty-params.ts';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

const NotesRoute = () => {
  return (
    <>
      <NotesApp />
      <Outlet />
    </>
  );
};

export const Route = createFileRoute('/notes/$category')({
  params: {
    parse: (rawParams) => ({
      category: rawParams.category as NoteCategory,
    }),
  },
  beforeLoad: ({ params }) => {
    if (!isValidNoteCategory(params.category)) {
      throw redirect({
        to: '/notes/$category',
        params: { category: 'active' },
      });
    }
  },
  component: NotesRoute,
  loader: async ({ context: { queryClient }, params: { category } }) =>
    await queryClient.fetchQuery(getFetchNotesQuery(category)),
});
