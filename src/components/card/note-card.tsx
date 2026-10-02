import { Markdown } from '@/components/content/markdown.tsx';
import { Note } from '@/types/note.ts';

type NoteCardProps = {
  note: Note;
  onClick: () => void;
};

export const NoteCard = ({ note, onClick }: NoteCardProps) => (
  <button
    onClick={onClick}
    className="flex max-h-96 min-h-12 w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white p-4 text-left break-words transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
  >
    {note.title && (
      <h3 className="mb-4 shrink-0 font-semibold text-zinc-800 dark:text-zinc-200">
        {note.title}
      </h3>
    )}
    {note.content && (
      <div className="min-h-0 w-full overflow-hidden">
        <Markdown md={note.content} />
      </div>
    )}
  </button>
);
