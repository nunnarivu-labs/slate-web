import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

export const NewNoteButton = () => {
  const navigate = useNavigate();
  const params = useParams({ from: '/_auth/notes/$category' });
  const search = useSearch({ from: '/_auth/notes/$category' });

  return (
    <button
      type="button"
      aria-label="New note"
      title={
        params.category === 'trash'
          ? 'New notes cannot be created in Trash'
          : 'New note'
      }
      disabled={params.category === 'trash'}
      onClick={() =>
        void navigate({
          to: '/notes/$category/$id',
          params: { category: params.category, id: 'new' },
          search,
        })
      }
      className="pointer-events-auto inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
    >
      <Plus size={18} aria-hidden="true" />
      <span className="hidden sm:inline">New note</span>
    </button>
  );
};
