type AddNoteCardProps = {
  onClick: () => void;
};

export const AddNoteCard = ({ onClick }: AddNoteCardProps) => {
  return (
    <div
      onClick={onClick}
      className="w-full max-w-[600px] mx-auto p-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-md cursor-text hover:shadow-lg transition-shadow"
    >
      <p className="text-zinc-500 dark:text-zinc-400">Take a note...</p>
    </div>
  );
};
