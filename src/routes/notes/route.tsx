import { KeepClonePage } from '@/components/card/keep-clone-page.tsx';
import { fetchNotes } from '@/data/fetch-notes.ts';
import { createFileRoute } from '@tanstack/react-router';

const Notes = () => {
  return <KeepClonePage />;
};

export const Route = createFileRoute('/notes')({
  component: Notes,
  loader: async () => await fetchNotes(),
});
