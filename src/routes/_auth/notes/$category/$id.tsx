import { NoteModal } from '@/components/card/modal/note-modal.tsx';
import { getFetchNoteByIdQuery } from '@/query/fetch-note-by-id-query.ts';
import { createFileRoute, redirect } from '@tanstack/react-router';

const EditNoteRoute = () => <NoteModal note={Route.useLoaderData()} />;

export const Route = createFileRoute('/_auth/notes/$category/$id')({
  component: EditNoteRoute,
  params: {
    parse: (rawParams) => {
      return { id: rawParams.id as 'new' | (string & {}) };
    },
  },
  loader: async ({ context: { queryClient }, params: { category, id } }) => {
    if (id === 'new') return null;

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
