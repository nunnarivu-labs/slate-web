import { NoteCloseHighlightProvider } from '@/components/feedback/note-close-highlight.tsx';
import { NotesApp } from '@/components/notes-app.tsx';
import { NoteCategory } from '@/types/note-category.ts';
import { isValidNoteCategory } from '@/utils/note-categoty-params.ts';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

const NotesRoute = () => (
  <NoteCloseHighlightProvider>
    <NotesApp />
    <Outlet />
  </NoteCloseHighlightProvider>
);

export const Route = createFileRoute('/_auth/notes/$category')({
  params: {
    parse: (rawParams) => ({
      category: rawParams.category as NoteCategory,
    }),
  },

  validateSearch: (rawSearch) => ({
    q:
      typeof rawSearch.q === 'string'
        ? rawSearch.q.trim().slice(0, 256) || undefined
        : undefined,
    tags: rawSearch.tags ? (rawSearch.tags as string[]) : undefined,
  }),

  beforeLoad: ({ params, search }) => {
    if (!isValidNoteCategory(params.category)) {
      throw redirect({
        to: '/notes/$category',
        params: { category: 'active' },
        search,
      });
    }
  },

  component: NotesRoute,
});
