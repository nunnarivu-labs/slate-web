import { CardDialog } from '@/components/card/card-dialog.tsx';
import { fetchNoteById } from '@/data/fetch-notes.ts';
import { createFileRoute, redirect } from '@tanstack/react-router';

const EditNoteRoute = () => <CardDialog note={Route.useLoaderData()} />;

export const Route = createFileRoute('/notes/$id')({
  component: EditNoteRoute,
  loader: async ({ params }) => {
    const { id } = params;

    try {
      return await fetchNoteById({ data: { id } });
    } catch {
      throw redirect({ to: '/notes' });
    }
  },
});
