import { Route } from '@/routes/_auth/notes/$category/$id.tsx';
import { NoteSaveActionType } from '@/types/note-save-action.ts';
import { Note } from '@/types/note.ts';
import { TagWithStatus } from '@/types/tag.ts';
import { useMutation } from 'convex/react';

import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

type SaveNoteArgs = {
  note: Note;
  isNoteDirty: boolean;
  tags: TagWithStatus[];
  action: NoteSaveActionType;
};

export const useSaveNote = () => {
  const isNewNote = Route.useParams().id === 'new';

  const saveNoteMutation = useMutation(api.tasks.saveNote);
  const updateNoteMutation = useMutation(api.tasks.updateNote);
  const deleteNoteMutation = useMutation(api.tasks.deleteNote);
  const updateTagsMutation = useMutation(api.tasks.updateTags);

  return async ({ note, tags, action, isNoteDirty }: SaveNoteArgs) => {
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
        note: {
          title: note.title,
          content: note.content,
          category: note.category,
        },
        tags,
      });
    } else {
      if (isNoteDirty) {
        await updateNoteMutation({
          id: note.id as Id<'notes'>,
          note: {
            title: note.title,
            content: note.content,
            category: note.category,
          },
          tags,
        });
      } else if (tags.some((tag) => tag.status !== 'ALREADY_ADDED')) {
        await updateTagsMutation({ noteId: note.id as Id<'notes'>, tags });
      }
    }
  };
};
