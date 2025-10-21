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
      className="mx-auto w-full max-w-[600px] cursor-text justify-center rounded-lg border border-zinc-300 bg-white p-4 shadow-md transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
    >
      <p className="text-left text-zinc-500 dark:text-zinc-400">
        Take a note...
      </p>
    </button>
  );
};
