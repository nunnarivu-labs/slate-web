import { NoteModalIcon } from '@/components/card/modal/note-modal-icon.tsx';
import { TagInputPopover } from '@/components/card/popover/tag-input-popover.tsx';
import { ContentEditor } from '@/components/content/content-editor.tsx';
import { Markdown } from '@/components/content/markdown.tsx';
import { Route } from '@/routes/_auth/notes/$category/$id.tsx';
import { NoteSaveActionType } from '@/types/note-save-action.ts';
import { Note } from '@/types/note.ts';
import {
  Archive,
  Home,
  MoreVertical,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash,
} from 'lucide-react';
import {
  ChangeEvent,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
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

  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [isTagInputOpen, setIsTagInputOpen] = useState(false);
  const moreOptionsRef = useRef<HTMLDivElement>(null); // Ref for click-outside detection

  const [note, setNote] = useState<Note>(
    currentNote
      ? { ...currentNote }
      : {
          id: uuid(),
          title: '',
          content: '',
          category: params.category,
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreOptionsRef.current &&
        !moreOptionsRef.current.contains(event.target as Node)
      ) {
        setIsMoreOptionsOpen(false);
        setIsTagInputOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 5. Placeholder function for your tag logic
  const handleAddTag = (tag: string) => {
    console.log('Adding tag:', tag);
    // Here you will update your `note` state with the new tag
    // e.g., setNote(prev => ({...prev, tags: [...prev.tags, tag]}));
    setIsTagInputOpen(false); // Close popover after adding
  };

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
          <Markdown md={note.content} className="md-preview overflow-y-auto" />
        ) : (
          <ContentEditor
            content={note.content}
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
            onClick={() => setIsTagInputOpen((prev) => !prev)}
            tooltip="Tag"
          >
            <Tag size={20} />
          </NoteModalIcon>
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
          <div ref={moreOptionsRef} className="relative">
            <NoteModalIcon
              onClick={() => setIsMoreOptionsOpen((prev) => !prev)}
              tooltip="More options"
            >
              <MoreVertical size={20} />
            </NoteModalIcon>

            {/* The "More Options" Dropdown */}
            {isMoreOptionsOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 bottom-full mb-2 w-48 rounded-lg border bg-white p-2 shadow-xl dark:border-zinc-600 dark:bg-zinc-700"
              >
                <button
                  onClick={() => {
                    setIsMoreOptionsOpen(false); // Close this menu
                    setIsTagInputOpen(true); // Open the tag input
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-600"
                >
                  <Tag size={16} />
                  <span>Add Tags</span>
                </button>
                {/* You can add more options here in the future */}
              </div>
            )}

            {/* The Tag Input Popover */}
            {isTagInputOpen && (
              <TagInputPopover
                onAddTag={handleAddTag}
                onClose={() => setIsTagInputOpen(false)}
              />
            )}
          </div>
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
