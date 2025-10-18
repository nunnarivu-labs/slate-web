import { NotesApp } from '@/components/notes-app.tsx';
import { fetchNotes } from '@/data/fetch-notes.ts';
import { Outlet, createFileRoute } from '@tanstack/react-router';

const NotesRoute = () => {
  return (
    <>
      <NotesApp />
      <Outlet />
    </>
  );
};

export const Route = createFileRoute('/notes')({
  component: NotesRoute,
  loader: async () => await fetchNotes(),
});
