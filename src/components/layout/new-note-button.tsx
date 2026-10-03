import {
  shortcutHint,
  useKeyboardShortcut,
} from '@/hooks/use-keyboard-shortcut';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

export const NewNoteButton = () => {
  const navigate = useNavigate();
  const params = useParams({ from: '/_auth/notes/$category' });
  const search = useSearch({ from: '/_auth/notes/$category' });

  const createNote = () =>
    void navigate({
      to: '/notes/$category/$id',
      params: { category: params.category, id: 'new' },
      search,
    });
  useKeyboardShortcut('mod+shift+enter', createNote, {
    scope: 'list',
    enabled: params.category !== 'trash',
  });

  return (
    <button
      type="button"
      aria-label="New note"
      title={
        params.category === 'trash'
          ? 'New notes cannot be created in Trash'
          : `New note (${shortcutHint('Shift + Enter')})`
      }
      disabled={params.category === 'trash'}
      onClick={createNote}
      className="new-note-floating pointer-events-auto absolute right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40 md:right-8"
    >
      <Plus size={26} aria-hidden="true" />
    </button>
  );
};
