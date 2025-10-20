import { useParams } from '@tanstack/react-router';

type AddNoteCardProps = {
  onClick: () => void;
};

export const AddNoteCard = ({ onClick }: AddNoteCardProps) => {
  const params = useParams({ from: '/notes/$category' });

  return (
    <button
      onClick={onClick}
      disabled={params.category === 'trash'}
      className="w-full max-w-[600px] mx-auto p-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-md cursor-text hover:shadow-lg transition-shadow dark:hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <p className="text-zinc-500 dark:text-zinc-400 text-left">
        Take a note...
      </p>
    </button>
  );
};
