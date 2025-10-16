import NoteCard from '@/components/card/note-card.tsx';
import { createFileRoute } from '@tanstack/react-router';

const App = () => {
  return <NoteCard />;
};

export const Route = createFileRoute('/app')({
  component: App,
});
