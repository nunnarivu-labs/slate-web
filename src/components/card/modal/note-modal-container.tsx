import {
  NoteModal,
  NoteModalRef,
} from '@/components/card/modal/note-modal.tsx';
import { Loader } from '@/components/loader.tsx';
import { useSaveNote } from '@/hooks/use-save-note.ts';
import { NoteSaveActionType } from '@/types/note-save-action.ts';
import { docToNote } from '@/utils/doc-note-converter.ts';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from '@tanstack/react-router';
import { useCallback, useRef } from 'react';

import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export const NoteModalContainer = () => {
  const params = useParams({ from: '/_auth/notes/$category/$id' });
  const navigate = useNavigate();

  const noteModalRef = useRef<NoteModalRef>(null);

  const noteQuery = useQuery({
    ...convexQuery(api.tasks.fetchNote, { id: params.id as Id<'notes'> }),
    enabled: params.id !== 'new',
    select: (data) => (data === null ? null : docToNote(data)),
  });

  const saveNote = useSaveNote();

  const handleSaveAndClose = useCallback(
    async (action: NoteSaveActionType) => {
      const modalRef = noteModalRef.current;

      if (!modalRef) return;

      const { note, isDirty } = modalRef;

      if (note === null) return;

      if (action !== 'save' || (action === 'save' && isDirty)) {
        await saveNote({ note, action });
      }

      await navigate({
        to: '/notes/$category',
        params: { category: params.category },
      });
    },
    [saveNote, navigate, params],
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
        {params.id !== 'new' && noteQuery.isLoading && <Loader />}
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
