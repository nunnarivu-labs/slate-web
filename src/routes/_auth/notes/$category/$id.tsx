import { NoteModal } from '@/components/card/modal/note-modal.tsx';
import { docToNote } from '@/utils/doc-note-converter.ts';
import { convexQuery } from '@convex-dev/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';

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
      const note = await queryClient.fetchQuery(
        convexQuery(api.tasks.fetchNote, { id: id as Id<'notes'> }),
      );

      if (!note) {
        throw new Error(`No note with id '${id}'`);
      }

      return docToNote(note);
    } catch {
      throw redirect({
        to: '/notes/$category',
        params: { category },
      });
    }
  },
});
