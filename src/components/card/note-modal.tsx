import { Note } from '@/types/note.ts';
import {
  Archive,
  Bell,
  Image as ImageIcon,
  MoreVertical,
  Palette,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// The default state for a new, empty note
const EMPTY_NOTE: Note = { id: '', title: '', content: '' };

type NoteModalProps = {
  noteToEdit: Note | null; // null for a new note, a Note object for editing
  onClose: () => void;
  onSave: (noteToSave: Note) => void;
  isAnimatingOut: boolean;
};

export const NoteModal = ({
  noteToEdit,
  onClose,
  onSave,
  isAnimatingOut,
}: NoteModalProps) => {
  const [note, setNote] = useState<Note>(noteToEdit || EMPTY_NOTE);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // When the modal opens, sync its internal state with the note being edited
    setNote(noteToEdit || EMPTY_NOTE);
  }, [noteToEdit]);

  useEffect(() => {
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [note.content]);

  const handleSaveAndClose = () => {
    if (note.title.trim() || note.content.trim()) {
      onSave(note);
    }
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setNote((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-full max-w-[600px] rounded-lg bg-white dark:bg-zinc-800 shadow-2xl flex flex-col transition-all duration-200 ease-out
                 ${isAnimatingOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
    >
      <div className="p-4">
        <input
          name="title"
          value={note.title}
          onChange={handleChange}
          placeholder="Title"
          className="w-full bg-transparent text-lg font-semibold outline-none mb-4 text-zinc-800 dark:text-zinc-200"
          autoFocus
        />
        <textarea
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
          {/* Toolbar icons... */}
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
          onClick={handleSaveAndClose}
          className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};
