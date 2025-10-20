import { NoteModalIcon } from '@/components/card/modal/note-modal-icon.tsx';
import { saveNote } from '@/data/save-note.ts';
import { getFetchNoteByIdQueryKey } from '@/query/fetch-note-by-id-query.ts';
import { getFetchNotesQueryKey } from '@/query/fetch-notes-query.ts';
import { Note } from '@/types/note.ts';
import {
  useNavigate,
  useParams,
  useRouteContext,
  useRouter,
} from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import {
  Archive,
  Bell,
  Image as ImageIcon,
  MoreVertical,
  Palette,
} from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';

interface NoteModalProps {
  note: Note | null;
}

export const NoteModal = ({ note: currentNote }: NoteModalProps) => {
  const navigate = useNavigate();
  const router = useRouter();

  const params = useParams({ from: '/notes/$category' });
  const { queryClient } = useRouteContext({ from: '/notes/$category' });

  const saveNoteFn = useServerFn(saveNote);

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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDirtyRef = useRef(false);

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
    if (isDirtyRef.current) {
      const isNew = currentNote === null;

      const dateNow = Date.now();

      if (isNew) {
        note.createdAt = dateNow;
      }

      note.updatedAt = dateNow;

      await saveNoteFn({ data: { note } });

      await router.invalidate();
      await queryClient.invalidateQueries({
        queryKey: getFetchNotesQueryKey(note.category),
      });

      if (!isNew) {
        await queryClient.invalidateQueries({
          queryKey: getFetchNoteByIdQueryKey(note.id),
        });
      }
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
            <NoteModalIcon>
              <Bell size={20} />
            </NoteModalIcon>
            <NoteModalIcon>
              <Palette size={20} />
            </NoteModalIcon>
            <NoteModalIcon>
              <ImageIcon size={20} />
            </NoteModalIcon>
            <NoteModalIcon>
              <Archive size={20} />
            </NoteModalIcon>
            <NoteModalIcon>
              <MoreVertical size={20} />
            </NoteModalIcon>
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
