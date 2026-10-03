import { Archive, Home, Loader2, Trash2 } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

import type { NoteCategory } from '../../types/note-category.ts';
import { Note } from '../../types/note.ts';
import { Markdown } from '../content/markdown.tsx';

type NoteCardProps = {
  note: Note;
  onClick: () => void;
  onMove: (category: NoteCategory) => Promise<void>;
  highlighted?: boolean;
};

export const NoteCard = ({
  note,
  onClick,
  onMove,
  highlighted,
}: NoteCardProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<NoteCategory | null>(
    null,
  );
  const [error, setError] = useState('');
  const moving = useRef(false);
  const handleMove = async (category: NoteCategory) => {
    if (moving.current) return;
    moving.current = true;
    setPendingCategory(category);
    setError('');
    try {
      await onMove(category);
    } catch {
      setError('Could not move this note. Please try again.');
    } finally {
      moving.current = false;
      setPendingCategory(null);
    }
  };

  useLayoutEffect(() => {
    const preview = previewRef.current;
    const content = contentRef.current;
    if (!preview || !content) {
      setIsTruncated(false);
      return;
    }
    const measure = () =>
      setIsTruncated(preview.scrollHeight > preview.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(preview);
    observer.observe(content);
    return () => observer.disconnect();
  }, [note.content]);

  return (
    <div className="note-card relative flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white text-left break-words transition-shadow hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600">
      {highlighted && (
        <div aria-hidden="true" className="note-close-highlight" />
      )}
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open ${note.title || 'untitled note'}`}
        className="note-card-open flex w-full min-w-0 flex-1 cursor-pointer flex-col p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-500"
      >
        {note.title && (
          <h3 className="mb-3 line-clamp-2 shrink-0 font-semibold text-zinc-800 dark:text-zinc-200">
            {note.title}
          </h3>
        )}
        {note.content && (
          <div
            ref={previewRef}
            className={`max-h-112 w-full overflow-hidden ${isTruncated ? '[mask-image:linear-gradient(to_bottom,black_70%,transparent)]' : ''}`}
          >
            <div ref={contentRef}>
              <Markdown md={note.content} />
            </div>
          </div>
        )}
      </button>
      <div
        role="group"
        aria-label="Note actions"
        aria-busy={pendingCategory !== null}
        className="note-card-actions absolute inset-x-0 bottom-0 flex items-center gap-1 bg-linear-to-t from-white from-60% to-white/0 px-2 pt-5 pb-2 transition-opacity motion-reduce:transition-none dark:from-zinc-800 dark:to-zinc-800/0"
      >
        {(
          [
            { category: 'active', label: 'Move to Active', Icon: Home },
            { category: 'archive', label: 'Archive note', Icon: Archive },
            { category: 'trash', label: 'Move to Trash', Icon: Trash2 },
          ] as const
        )
          .filter((action) => action.category !== note.category)
          .map(({ category, label, Icon }) => (
            <button
              key={category}
              type="button"
              title={label}
              aria-label={label}
              disabled={pendingCategory !== null}
              onClick={() => void handleMove(category)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
            >
              {pendingCategory === category ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Icon size={17} />
              )}
            </button>
          ))}
      </div>
      {error && (
        <p
          role="alert"
          className="px-4 pb-3 text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
};
