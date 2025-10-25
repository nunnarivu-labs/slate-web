import { NoteModalContainer } from '@/components/card/modal/note-modal-container.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/notes/$category/$id')({
  component: NoteModalContainer,

  params: {
    parse: (rawParams) => {
      return { id: rawParams.id as 'new' | (string & {}) };
    },
  },
});
