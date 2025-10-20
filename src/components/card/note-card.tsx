import { Note } from '@/types/note.ts';

type NoteCardProps = {
  note: Note;
  onClick: () => void;
};

export const NoteCard = ({ note, onClick }: NoteCardProps) => {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer break-inside-avoid overflow-hidden rounded-lg border border-zinc-300 bg-white p-4 text-left break-words transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
    >
      {note.title && (
        <h3 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-200">
          {note.title}
        </h3>
      )}
      {note.content && (
        <p className="text-sm break-words whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
          {note.content}
        </p>
      )}
    </button>
  );
};
