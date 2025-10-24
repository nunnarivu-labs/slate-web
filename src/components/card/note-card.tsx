import { MarkdownPreview } from '@/components/markdown/markdown-preview.tsx';
import { Note } from '@/types/note.ts';

type NoteCardProps = {
  note: Note;
  onClick: () => void;
};

export const NoteCard = ({ note, onClick }: NoteCardProps) => {
  return (
    <button
      onClick={onClick}
      className="flex max-h-96 min-h-96 max-w-72 min-w-72 cursor-pointer break-inside-avoid flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white p-4 text-left break-words transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
    >
      {note.title && (
        <h3 className="mb-4 font-semibold text-zinc-800 dark:text-zinc-200">
          {note.title}
        </h3>
      )}
      {note.content && <MarkdownPreview md={note.content} />}
    </button>
  );
};
