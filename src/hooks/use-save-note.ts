import { deleteNoteEntry } from '@/data/delete-note-entry.ts';
import { saveNote } from '@/data/save-note.ts';
import { getFetchNoteByIdQueryKey } from '@/query/fetch-note-by-id-query.ts';
import { getFetchNotesQueryKey } from '@/query/fetch-notes-query.ts';
import { Route } from '@/routes/_auth/notes/$category/$id.tsx';
import { NoteSaveActionType } from '@/types/note-save-action.ts';
import { Note } from '@/types/note.ts';
import { useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';

type SaveNoteArgs = {
  note: Note;
  action: NoteSaveActionType;
};

export const useSaveNote = () => {
  const router = useRouter();

  const saveNoteFn = useServerFn(saveNote);
  const deleteNoteEntryFn = useServerFn(deleteNoteEntry);

  const { queryClient } = Route.useRouteContext();

  const isNewNote = Route.useParams().id === 'new';

  return async ({ note, action }: SaveNoteArgs) => {
    const isNoteEmpty = !note.title && !note.content;

    if (isNewNote && isNoteEmpty) return;
    else if (!isNewNote && isNoteEmpty) {
      await deleteNoteEntryFn({ data: { id: note.id } });
      return;
    }

    const dateNow = Date.now();

    if (isNewNote) {
      note.createdAt = dateNow;
    }

    note.updatedAt = dateNow;

    if (action !== 'save') {
      note.category = action;
    }

    await saveNoteFn({ data: { note } });

    await router.invalidate();
    await queryClient.invalidateQueries({
      queryKey: getFetchNotesQueryKey(note.category),
    });

    if (!isNewNote) {
      await queryClient.invalidateQueries({
        queryKey: getFetchNoteByIdQueryKey(note.id),
      });
    }
  };
};
