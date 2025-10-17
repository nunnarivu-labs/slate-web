import { Note } from '@/types/note.ts';
import { forwardRef } from 'react';

type ExistingNoteCardProps = {
  note: Note;
  onClick: () => void;
};

export const ExistingNoteCard = forwardRef<
  HTMLDivElement,
  ExistingNoteCardProps
>(({ note, onClick }, ref) => {
  return (
    <div
      ref={ref}
      onClick={onClick}
      className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-300 dark:border-zinc-700 cursor-pointer hover:shadow-lg transition-shadow break-words"
    >
      {note.title && (
        <h3 className="font-semibold mb-2 text-zinc-800 dark:text-zinc-200">
          {note.title}
        </h3>
      )}
      <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
        {note.content}
      </p>
    </div>
  );
});
