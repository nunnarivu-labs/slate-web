import { useMutation } from 'convex/react';
import { Check, Loader2, X } from 'lucide-react';
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { NoteCategory } from '../../types/note-category';

type NoteMove = {
  noteId: Id<'notes'>;
  previousCategory: NoteCategory;
  category: 'archive' | 'trash';
};
type UndoNotice = NoteMove & { id: number };
const UndoContext = createContext<((move: NoteMove) => void) | null>(null);

export const useNoteMoveUndo = () => {
  const offerUndo = useContext(UndoContext);
  if (!offerUndo)
    throw new Error('Note move Undo requires NoteMoveUndoProvider.');
  return offerUndo;
};

function UndoToast({
  notice,
  onDismiss,
}: {
  notice: UndoNotice;
  onDismiss: (id: number) => void;
}) {
  const undoMove = useMutation(api.tasks.undoNoteMove);
  const [status, setStatus] = useState<
    'ready' | 'pending' | 'success' | 'error' | 'conflict'
  >('ready');
  const [paused, setPaused] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    if (
      paused ||
      status === 'pending' ||
      status === 'error' ||
      status === 'conflict'
    )
      return;
    const timer = setTimeout(
      () => onDismiss(notice.id),
      status === 'success' ? 2500 : 5000,
    );
    return () => clearTimeout(timer);
  }, [paused, status, notice.id, onDismiss]);

  const undo = async () => {
    if (pending.current) return;
    pending.current = true;
    setStatus('pending');
    try {
      const restored = await undoMove({
        id: notice.noteId,
        previousCategory: notice.previousCategory,
        expectedCategory: notice.category,
      });
      setStatus(restored ? 'success' : 'conflict');
    } catch {
      setStatus('error');
    } finally {
      pending.current = false;
    }
  };

  const message =
    status === 'success'
      ? 'Move undone'
      : status === 'error'
        ? 'Could not undo. Please try again.'
        : status === 'conflict'
          ? 'This note has moved again. Undo is no longer available.'
          : notice.category === 'archive'
            ? 'Note archived'
            : 'Note moved to Trash';
  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPaused(false);
      }}
      className="pointer-events-auto flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
    >
      <span
        role="status"
        className="flex min-w-0 flex-1 items-center gap-2 text-sm text-zinc-800 dark:text-zinc-100"
      >
        {status === 'pending' ? (
          <Loader2 size={16} className="shrink-0 animate-spin" />
        ) : status === 'success' ? (
          <Check size={16} className="shrink-0 text-green-600" />
        ) : null}
        {status === 'pending' ? 'Undoing…' : message}
      </span>
      {['ready', 'pending', 'error'].includes(status) && (
        <button
          type="button"
          disabled={status === 'pending'}
          onClick={() => void undo()}
          className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-zinc-700"
        >
          {status === 'error' ? 'Retry' : 'Undo'}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss notification"
        disabled={status === 'pending'}
        onClick={() => onDismiss(notice.id)}
        className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-40 dark:hover:bg-zinc-700"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function NoteMoveUndoProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<UndoNotice[]>([]);
  const nextId = useRef(0);
  const offerUndo = useCallback((move: NoteMove) => {
    const id = ++nextId.current;
    // A new move of the same note supersedes its previous Undo notice.
    setNotices((prev) => [
      ...prev.filter((notice) => notice.noteId !== move.noteId),
      { ...move, id },
    ]);
  }, []);
  const dismiss = useCallback(
    (id: number) =>
      setNotices((prev) => prev.filter((notice) => notice.id !== id)),
    [],
  );
  return (
    <UndoContext.Provider value={offerUndo}>
      {children}
      <div
        aria-label="Notifications"
        className="note-notifications pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex max-h-[50dvh] flex-col gap-2 overflow-y-auto pb-[env(safe-area-inset-bottom)] sm:left-auto sm:w-96"
      >
        {notices.map((notice) => (
          <UndoToast key={notice.id} notice={notice} onDismiss={dismiss} />
        ))}
      </div>
    </UndoContext.Provider>
  );
}
