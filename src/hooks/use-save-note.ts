import { Route } from '@/routes/_auth/notes/$category/$id.tsx';
import { NoteSaveActionType } from '@/types/note-save-action.ts';
import { Note } from '@/types/note.ts';
import { useMutation } from 'convex/react';

import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

type SaveNoteArgs = {
  note: Note;
  action: NoteSaveActionType;
};

export const useSaveNote = () => {
  const isNewNote = Route.useParams().id === 'new';

  const saveNoteMutation = useMutation(api.tasks.saveNote);
  const updateNoteMutation = useMutation(api.tasks.updateNote);
  const deleteNoteMutation = useMutation(api.tasks.deleteNote);

  return async ({ note, action }: SaveNoteArgs) => {
    const isNoteEmpty = !note.title && !note.content;

    if (isNewNote && isNoteEmpty) return;
    else if (!isNewNote && isNoteEmpty) {
      await deleteNoteMutation({ id: note.id as Id<'notes'> });
      return;
    }

    if (action !== 'save') {
      note.category = action;
    }

    if (isNewNote) {
      await saveNoteMutation({
        title: note.title,
        content: note.content,
        category: note.category,
      });
    } else {
      await updateNoteMutation({
        id: note.id as Id<'notes'>,
        note: {
          title: note.title,
          content: note.content,
          category: note.category,
        },
      });
    }
  };
};
