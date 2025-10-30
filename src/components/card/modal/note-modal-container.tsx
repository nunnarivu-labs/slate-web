import { NoteModal } from '@/components/card/modal/note-modal.tsx';
import { Loader } from '@/components/loader.tsx';
import { useSaveNote } from '@/hooks/use-save-note.ts';
import { Route } from '@/routes/_auth/notes/$category/$id.tsx';
import { NoteModalRef } from '@/types/note-modal-ref.ts';
import { NoteSaveActionType } from '@/types/note-save-action.ts';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { useCallback, useRef, useState } from 'react';

import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export const NoteModalContainer = () => {
  const params = Route.useParams();
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);

  const noteModalRef = useRef<NoteModalRef>(null);

  const noteQuery = useQuery({
    ...convexQuery(
      api.tasks.fetchNote,
      params.id === 'new'
        ? 'skip'
        : {
            id: params.id as Id<'notes'>,
          },
    ),
  });

  const saveNote = useSaveNote();

  const handleSaveAndClose = useCallback(
    async (action: NoteSaveActionType) => {
      if (isSaving) return;

      const modalRef = noteModalRef.current;

      if (!modalRef) return;

      const { note, isDirty, tags } = modalRef;

      if (note === null) return;

      setIsSaving(true);
      await saveNote({ note, tags, action, isNoteDirty: isDirty });

      await navigate({
        to: '/notes/$category',
        params: { category: params.category },
      });
    },
    [saveNote, navigate, params, isSaving],
  );

  return (
    <div
      onClick={() => handleSaveAndClose('save')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
      className={
        'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'
      }
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[80vh] w-full max-w-4xl scale-100 flex-col rounded-lg bg-white shadow-2xl dark:bg-zinc-800"
      >
        {params.id === 'new' && (
          <NoteModal
            note={null}
            ref={noteModalRef}
            onClose={handleSaveAndClose}
          />
        )}
        {noteQuery.isSuccess && (
          <NoteModal
            note={noteQuery.data}
            ref={noteModalRef}
            onClose={handleSaveAndClose}
          />
        )}
        {params.id !== 'new' && noteQuery.isLoading && (
          <Loader text="Loading note" />
        )}
        {params.id !== 'new' && noteQuery.isError && (
          <Navigate
            to="/notes/$category"
            params={{ category: params.category }}
          />
        )}
      </div>
    </div>
  );
};
