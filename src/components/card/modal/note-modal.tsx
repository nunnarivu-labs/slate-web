import { NoteModalIcon } from '@/components/card/modal/note-modal-icon.tsx';
import { MarkdownEditor } from '@/components/markdown/markdown-editor.tsx';
import { MarkdownPreview } from '@/components/markdown/markdown-preview.tsx';
import { Route } from '@/routes/_auth/notes/$category/$id.tsx';
import { NoteSaveActionType } from '@/types/note-save-action.ts';
import { Note } from '@/types/note.ts';
import { Archive, Home, ToggleLeft, ToggleRight, Trash } from 'lucide-react';
import {
  ChangeEvent,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { v4 as uuid } from 'uuid';

export type NoteModalRef = {
  note: Note | null;
  isDirty: boolean;
};

type NoteModalProps = {
  note: Note | null;
  ref: RefObject<NoteModalRef | null>;
  onClose: (action: NoteSaveActionType) => void;
};

export const NoteModal = ({
  note: currentNote,
  ref,
  onClose,
}: NoteModalProps) => {
  const params = Route.useParams();
  const { userId } = Route.useRouteContext();

  const [note, setNote] = useState<Note>(
    currentNote
      ? { ...currentNote }
      : {
          id: uuid(),
          userId,
          title: '',
          content: '',
          category: params.category,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
  );

  const [previewMode, setPreviewMode] = useState(false);

  const isNoteEmpty = !note.title && !note.content;

  const [isDirty, setIsDirty] = useState(false);

  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        await onClose('save');
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNote((prev) => ({ ...prev, title: e.target.value }));
    setIsDirty(true);
  };

  const handleContentChange = (md: string | undefined) => {
    setNote((prev) => ({ ...prev, content: md ?? '' }));
    setIsDirty(true);
  };

  const handlePreviewModeToggle = () => setPreviewMode((prev) => !prev);

  useImperativeHandle(ref, () => ({ note, isDirty }), [note, isDirty]);

  return (
    <>
      <div className="flex min-h-0 flex-grow flex-col p-4">
        {!previewMode && (
          <input
            type="text"
            value={note.title}
            onChange={handleTitleChange}
            placeholder="Title"
            className="mb-4 w-full flex-shrink-0 bg-transparent text-lg font-semibold text-zinc-800 outline-none dark:text-zinc-200"
          />
        )}
        {previewMode && note.title && (
          <h3 className="mb-4 font-semibold text-zinc-800 dark:text-zinc-200">
            {note.title}
          </h3>
        )}
        {previewMode ? (
          <button
            className="w-full resize-none overflow-y-auto text-left"
            onClick={handlePreviewModeToggle}
          >
            <MarkdownPreview md={note.content} />
          </button>
        ) : (
          <MarkdownEditor
            md={note.content}
            onChange={handleContentChange}
            autofocusEnd
            placeholder="Take a note..."
          />
        )}
      </div>
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
          {note.category !== 'active' && (
            <NoteModalIcon
              disabled={isNoteEmpty}
              onClick={() => onClose('active')}
              tooltip="Active"
            >
              <Home size={20} />
            </NoteModalIcon>
          )}
          {note.category !== 'archive' && (
            <NoteModalIcon
              disabled={isNoteEmpty}
              onClick={() => onClose('archive')}
              tooltip="Archive"
            >
              <Archive size={20} />
            </NoteModalIcon>
          )}
          {note.category !== 'trash' && (
            <NoteModalIcon
              disabled={isNoteEmpty}
              onClick={() => onClose('trash')}
              tooltip="Trash"
            >
              <Trash size={20} />
            </NoteModalIcon>
          )}
          <NoteModalIcon
            disabled={isNoteEmpty}
            onClick={handlePreviewModeToggle}
            tooltip="Preview Mode"
          >
            {previewMode ? (
              <ToggleRight size={20} className="text-green-600" />
            ) : (
              <ToggleLeft size={20} />
            )}
          </NoteModalIcon>
        </div>
        <button
          onClick={() => onClose('save')}
          className="cursor-pointer rounded px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Close
        </button>
      </div>
    </>
  );
};
