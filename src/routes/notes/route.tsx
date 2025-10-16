import NoteCard from '@/components/card/note-card.tsx';
import { createFileRoute } from '@tanstack/react-router';

const Notes = () => <NoteCard />;

export const Route = createFileRoute('/notes')({
  component: Notes,
});
