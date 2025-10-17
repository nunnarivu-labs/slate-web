import { CollapsedCard } from '@/components/card/collapsed-card.tsx';
import NoteCard from '@/components/card/note-card.tsx';
import { fetchNotes } from '@/data/fetch-notes.ts';
import { createFileRoute } from '@tanstack/react-router';

const Notes = () => {
  const notes = Route.useLoaderData();

  return (
    <>
      <NoteCard />
      {notes.map((note) => (
        <CollapsedCard key={note.id} onClick={() => {}} note={note.note} />
      ))}
    </>
  );
};

export const Route = createFileRoute('/notes')({
  component: Notes,
  loader: async () => await fetchNotes(),
});
