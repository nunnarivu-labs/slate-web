import { NoteModal } from '@/components/card/modal/note-modal.tsx';
import { Loader } from '@/components/loader.tsx';
import { useSaveNote } from '@/hooks/use-save-note.ts';
import { Route } from '@/routes/_auth/notes/$category/$id.tsx';
import { NoteModalRef } from '@/types/note-modal-ref.ts';
import { NoteSaveActionType } from '@/types/note-save-action.ts';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate, useSearch } from '@tanstack/react-router';
import {
  ViewTransition,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';

import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

export const NoteModalContainer = () => {
  const params = Route.useParams();
  const navigate = useNavigate();
  const search = useSearch({ from: '/_auth/notes/$category' });

  const [isSaving, setIsSaving] = useState(false);
  const [visibility, setVisibility] = useState<'opening' | 'open' | 'closed'>(
    'opening',
  );
  const [isClosing, startClosing] = useTransition();

  // Route subscriptions are synchronous external-store updates. Insert the
  // boundaries in a separate React transition so their enter animation runs.
  useEffect(() => {
    startTransition(() => setVisibility('open'));
  }, []);

  useEffect(() => {
    if (visibility !== 'closed' || isClosing) return;

    // Keep the route mounted until React has committed the animated removal.
    // Passive effects normally run after the view transition finishes; without
    // browser support this navigates immediately, with no timer to wait out.
    void navigate({
      to: '/notes/$category',
      params: { category: params.category },
      search,
    });
  }, [visibility, isClosing, navigate, params.category, search]);

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
      try {
        await saveNote({ note, tags, action, isNoteDirty: isDirty });
        startClosing(() => setVisibility('closed'));
      } catch (error) {
        setIsSaving(false);
        throw error;
      }
    },
    [saveNote, isSaving, startClosing],
  );

  if (visibility !== 'open') return null;

  return (
    <>
      <ViewTransition default="none" enter="note-backdrop" exit="note-backdrop">
        <div aria-hidden="true" className="fixed inset-0 z-40 bg-black/70" />
      </ViewTransition>
      <ViewTransition
        default="none"
        enter="note-modal-enter"
        exit="note-modal-exit"
      >
        <div
          onClick={() => handleSaveAndClose('save')}
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-modal-title"
          className={'fixed inset-0 z-50 flex items-center justify-center p-4'}
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
                search={search}
              />
            )}
          </div>
        </div>
      </ViewTransition>
    </>
  );
};
