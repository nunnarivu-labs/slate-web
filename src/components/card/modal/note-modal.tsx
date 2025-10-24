import { NoteModalIcon } from '@/components/card/modal/note-modal-icon.tsx';
import { MarkdownEditor } from '@/components/markdown-editor.tsx';
import { useSaveNote } from '@/hooks/use-save-note.ts';
import { Route } from '@/routes/notes/$category/$id.tsx';
import { NoteSaveActionType } from '@/types/note-save-action.ts';
import { Note } from '@/types/note.ts';
import { MDXEditorMethods } from '@mdxeditor/editor';
import { useNavigate } from '@tanstack/react-router';
import { Archive, Home, Trash } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
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

  const mdxEditorMethodsRef = useRef<MDXEditorMethods>(null);
  const isDirtyRef = useRef(false);

  useEffect(() => mdxEditorMethodsRef?.current?.focus(), []);

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

  const handleSaveAndClose = async (action: NoteSaveActionType) => {
    if (
      (action !== 'save' || (action === 'save' && isDirtyRef.current)) &&
      mdxEditorMethodsRef.current
    ) {
      const md = mdxEditorMethodsRef.current.getMarkdown();
      await saveNote({ note: { ...note, content: md }, action });
    }

    await navigate({
      to: '/notes/$category',
      params: { category: params.category },
    });
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNote((prev) => ({ ...prev, title: e.target.value }));
    isDirtyRef.current = true;
  };

  const handleContentChange = (md: string) => {
    setNote((prev) => ({ ...prev, content: md }));
    isDirtyRef.current = true;
  };

  return (
    <div
      onClick={() => handleSaveAndClose('save')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
      className={
        'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'
      }
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[80vh] w-full max-w-4xl scale-100 flex-col rounded-lg bg-white shadow-2xl dark:bg-zinc-800"
      >
        <div className="flex min-h-0 flex-grow flex-col p-4">
          <input
            type="text"
            value={note.title}
            onChange={handleTitleChange}
            placeholder="Title"
            className="mb-4 w-full flex-shrink-0 bg-transparent text-lg font-semibold text-zinc-800 outline-none dark:text-zinc-200"
          />
          <div className="grow overflow-y-auto">
            <MarkdownEditor
              ref={mdxEditorMethodsRef}
              md={note.content}
              onChange={handleContentChange}
            />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between p-2">
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            {note.category !== 'active' && (
              <NoteModalIcon
                disabled={isNoteEmpty}
                onClick={() => handleSaveAndClose('active')}
                tooltip="Active"
              >
                <Home size={20} />
              </NoteModalIcon>
            )}
            {note.category !== 'archive' && (
              <NoteModalIcon
                disabled={isNoteEmpty}
                onClick={() => handleSaveAndClose('archive')}
                tooltip="Archive"
              >
                <Archive size={20} />
              </NoteModalIcon>
            )}
            {note.category !== 'trash' && (
              <NoteModalIcon
                disabled={isNoteEmpty}
                onClick={() => handleSaveAndClose('trash')}
                tooltip="Trash"
              >
                <Trash size={20} />
              </NoteModalIcon>
            )}
          </div>
          <button
            onClick={() => handleSaveAndClose('save')}
            className="cursor-pointer rounded px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
