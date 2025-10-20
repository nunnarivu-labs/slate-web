import { NoteModal } from '@/components/card/modal/note-modal.tsx';
import { createFileRoute } from '@tanstack/react-router';

const NewNoteRoute = () => <NoteModal note={null} />;

export const Route = createFileRoute('/notes/$category/new')({
  component: NewNoteRoute,
});
