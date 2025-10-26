import { NotesApp } from '@/components/notes-app.tsx';
import { NoteCategory } from '@/types/note-category.ts';
import { isValidNoteCategory } from '@/utils/note-categoty-params.ts';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

const NotesRoute = () => (
  <>
    <NotesApp />
    <Outlet />
  </>
);

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

  ssr: false,
});
