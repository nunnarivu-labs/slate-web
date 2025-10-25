import { Loader } from '@/components/loader.tsx';
import { NotesApp } from '@/components/notes-app.tsx';
import { NoteCategory } from '@/types/note-category.ts';
import { docToNote } from '@/utils/doc-note-converter.ts';
import { isValidNoteCategory } from '@/utils/note-categoty-params.ts';
import { convexQuery } from '@convex-dev/react-query';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { api } from '../../../../../convex/_generated/api';

const NotesRoute = () => {
  console.log('Inside Notes Route');
  return (
    <>
      <NotesApp />
      <Outlet />
    </>
  );
};

export const Route = createFileRoute('/_auth/notes/$category')({
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

  pendingComponent: () => <Loader />,

  loader: async ({ context: { queryClient }, params: { category } }) =>
    (
      await queryClient.fetchQuery({
        ...convexQuery(api.tasks.fetchNotes, { category }),
      })
    ).map(docToNote),
});
