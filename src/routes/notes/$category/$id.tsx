import { NoteModal } from '@/components/card/modal/note-modal.tsx';
import { getFetchNoteByIdQuery } from '@/query/fetch-note-by-id-query.ts';
import { createFileRoute, redirect } from '@tanstack/react-router';

const EditNoteRoute = () => <NoteModal note={Route.useLoaderData()} />;

export const Route = createFileRoute('/notes/$category/$id')({
  component: EditNoteRoute,
  loader: async ({ context: { queryClient }, params: { category, id } }) => {
    try {
      return await queryClient.fetchQuery(getFetchNoteByIdQuery(id));
    } catch {
      throw redirect({
        to: '/notes/$category',
        params: { category },
      });
    }
  },
});
