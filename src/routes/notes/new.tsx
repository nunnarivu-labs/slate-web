import { NoteModal } from '@/components/card/note-modal.tsx';
import { createFileRoute } from '@tanstack/react-router';

const NewNoteRoute = () => <NoteModal note={null} />;

export const Route = createFileRoute('/notes/new')({
  component: NewNoteRoute,
});
