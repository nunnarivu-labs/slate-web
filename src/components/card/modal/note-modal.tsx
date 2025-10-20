import { NoteModalIcon } from '@/components/card/modal/note-modal-icon.tsx';
import { useSaveNote } from '@/hooks/use-save-note.ts';
import { Route } from '@/routes/notes/$category/$id.tsx';
import { NoteSaveActionType } from '@/types/note-save-action.ts';
import { Note } from '@/types/note.ts';
import { useNavigate } from '@tanstack/react-router';
import { Archive, LucideInbox, Trash } from 'lucide-react';
import {
  ChangeEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import { v4 as uuid } from 'uuid';

interface NoteModalProps {
  note: Note | null;
}

export const NoteModal = ({ note: currentNote }: NoteModalProps) => {
  const navigate = useNavigate();
  const params = Route.useParams();

  const saveNote = useSaveNote();

  const [note, setNote] = useState<Note>(
    currentNote
      ? { ...currentNote }
      : {
          id: uuid(),
          title: '',
          content: '',
          category: params.category,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
  );

  const isNoteEmpty = !note.title && !note.content;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDirtyRef = useRef(false);

  const positionCursor = useEffectEvent(() => {
    const textarea = textareaRef.current;

    if (!textarea || !note.content) return;

    textarea.setSelectionRange(note.content.length, note.content.length);
  });

  useEffect(() => positionCursor(), []);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        await handleSaveAndClose('save');
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

  const handleSaveAndClose = async (action: NoteSaveActionType) => {
    if (action !== 'save' || (action === 'save' && isDirtyRef.current)) {
      await saveNote({ note, action });
    }

    await navigate({
      to: '/notes/$category',
      params: { category: params.category },
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setNote((prev) => ({ ...prev, [name]: value }));

    isDirtyRef.current = true;
  };

  return (
    <div
      onClick={() => handleSaveAndClose('save')}
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
            {note.category !== 'active' && (
              <NoteModalIcon
                disabled={isNoteEmpty}
                onClick={() => handleSaveAndClose('active')}
              >
                <LucideInbox size={20} />
              </NoteModalIcon>
            )}
            {note.category !== 'archive' && (
              <NoteModalIcon
                disabled={isNoteEmpty}
                onClick={() => handleSaveAndClose('archive')}
              >
                <Archive size={20} />
              </NoteModalIcon>
            )}
            {note.category !== 'trash' && (
              <NoteModalIcon
                disabled={isNoteEmpty}
                onClick={() => handleSaveAndClose('trash')}
              >
                <Trash size={20} />
              </NoteModalIcon>
            )}
          </div>
          <button
            onClick={() => handleSaveAndClose('save')}
            className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
