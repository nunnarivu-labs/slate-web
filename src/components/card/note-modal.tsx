import { Note } from '@/types/note.ts';
import { useNavigate } from '@tanstack/react-router';
import {
  Archive,
  Bell,
  Image as ImageIcon,
  MoreVertical,
  Palette,
} from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

interface NoteModalProps {
  note: Note | null;
}

const EMPTY_NOTE: Note = { id: '', title: '', content: '' };

export const NoteModal = ({ note: currentNote }: NoteModalProps) => {
  const navigate = useNavigate();

  const [note, setNote] = useState<Note>(currentNote || EMPTY_NOTE);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        await handleClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [note.content]);

  const handleClose = async () => {
    await navigate({ to: '/notes' });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setNote((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
      className={
        'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70'
      }
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-lg bg-white dark:bg-zinc-800 shadow-2xl scale-100"
      >
        <div className="p-4">
          <input
            name="title"
            type="text"
            value={note.title}
            onChange={handleChange}
            placeholder="Title"
            className="w-full bg-transparent text-lg font-semibold outline-none mb-4 text-zinc-800 dark:text-zinc-200"
          />
          <textarea
            autoFocus
            ref={textareaRef}
            name="content"
            value={note.content}
            onChange={handleChange}
            placeholder="Take a note..."
            className="w-full bg-transparent outline-none resize-none text-zinc-800 dark:text-zinc-200"
          />
        </div>
        <div className="flex items-center justify-between mt-2 p-2">
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <button className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700">
              <Bell size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700">
              <Palette size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700">
              <ImageIcon size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700">
              <Archive size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700">
              <MoreVertical size={20} />
            </button>
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
