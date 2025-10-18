import { CardDialog } from '@/components/card/card-dialog.tsx';
import { createFileRoute } from '@tanstack/react-router';

const NewNoteRoute = () => <CardDialog note={null} />;

export const Route = createFileRoute('/notes/new')({
  component: NewNoteRoute,
});
