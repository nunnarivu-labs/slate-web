import { NoteModalIcon } from '@/components/card/modal/note-modal-icon.tsx';
import { TagInputPopover } from '@/components/card/popover/tag-input-popover.tsx';
import { ContentEditor } from '@/components/content/content-editor.tsx';
import { Markdown } from '@/components/content/markdown.tsx';
import { Route } from '@/routes/_auth/notes/$category/$id.tsx';
import { NoteModalRef } from '@/types/note-modal-ref.ts';
import { NoteSaveActionType } from '@/types/note-save-action.ts';
import { Note } from '@/types/note.ts';
import { Tag as TagType } from '@/types/tag.ts';
import { TagWithCheckedStatus, TagWithStatus } from '@/types/tag.ts';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  Archive,
  Home,
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

import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

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

  const tagsPopoverRef = useRef<HTMLDivElement>(null); // Ref for click-outside detection\

  const [isTagInputOpen, setIsTagInputOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [uiTags, setUiTags] = useState<TagWithCheckedStatus[]>([]);
  const [tagsWithStatus, setTagsWithStatus] = useState<TagWithStatus[]>([]);

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

  const isNoteEmpty = !note.title && !note.content;

  const allTagsQuery = useQuery(convexQuery(api.tasks.fetchAllTags, {}));
  const noteTagsQuery = useQuery(
    convexQuery(
      api.tasks.fetchNoteTags,
      params.id === 'new' ? 'skip' : { noteId: params.id as Id<'notes'> },
    ),
  );

  useEffect(() => {
    if (allTagsQuery.isSuccess) {
      setUiTags(allTagsQuery.data.map((t) => ({ ...t, checked: false })));
    }
  }, [allTagsQuery.isSuccess, allTagsQuery.data]);

  useEffect(() => {
    if (noteTagsQuery.isSuccess) {
      setTagsWithStatus(
        noteTagsQuery.data.map((ntq) => ({ ...ntq, status: 'ALREADY_ADDED' })),
      );
    }
  }, [noteTagsQuery.isSuccess, noteTagsQuery.data]);

  useEffect(() => {
    if (allTagsQuery.isSuccess && noteTagsQuery.isSuccess) {
      setUiTags((prev) =>
        prev.map((t) => ({
          ...t,
          checked: !!noteTagsQuery.data.find((nt) => nt.id === t.id),
        })),
      );
    }
  }, [allTagsQuery.isSuccess, noteTagsQuery.isSuccess, noteTagsQuery.data]);

  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose('save');
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

  useImperativeHandle(
    ref,
    () => ({
      note,
      isDirty,
      tags: tagsWithStatus,
    }),
    [note, isDirty, tagsWithStatus],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | KeyboardEvent) => {
      if (
        tagsPopoverRef.current &&
        !tagsPopoverRef.current.contains(event.target as Node)
      ) {
        setIsTagInputOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addNewTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();

    if (trimmedTag) {
      const newTag: TagType = {
        id: Math.random().toString(36),
        name: trimmedTag,
      };

      setUiTags((prev) => [{ ...newTag, checked: true }, ...prev]);

      setTagsWithStatus((prev) => [
        ...prev,
        { ...newTag, status: 'NEWLY_CREATED' },
      ]);
    }
  }, []);

  const toggleTagCheck = useCallback(
    (tagId: string, checked: boolean) => {
      const updatedUiTags: TagWithCheckedStatus[] = uiTags.map((t) =>
        t.id !== tagId ? t : { ...t, checked },
      );

      setUiTags(updatedUiTags);

      if (checked) {
        const currentTag = updatedUiTags.find((t) => t.id === tagId);

        if (!tagsWithStatus.find((t) => t.id === tagId) && !!currentTag) {
          setTagsWithStatus((prev) => [
            ...prev,
            { id: currentTag.id, name: currentTag.name, status: 'NEWLY_ADDED' },
          ]);
        }
      } else {
        const uncheckedTag = tagsWithStatus.find((t) => t.id === tagId);

        if (
          uncheckedTag?.status === 'NEWLY_CREATED' ||
          uncheckedTag?.status === 'NEWLY_ADDED'
        ) {
          setTagsWithStatus((prev) => prev.filter((t) => t.id !== tagId));
        } else if (uncheckedTag?.status === 'ALREADY_ADDED') {
          setTagsWithStatus((prev) =>
            prev.map((t) => (t.id !== tagId ? t : { ...t, status: 'REMOVED' })),
          );
        }
      }
    },
    [uiTags, tagsWithStatus],
  );

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
            onClick={handlePreviewModeToggle}
            tooltip="Preview Mode"
          >
            {previewMode ? (
              <ToggleRight size={20} className="text-green-600" />
            ) : (
              <ToggleLeft size={20} />
            )}
          </NoteModalIcon>
          <div ref={tagsPopoverRef} className="relative">
            <NoteModalIcon
              disabled={isNoteEmpty}
              onClick={(ev) => {
                ev.stopPropagation();
                setIsTagInputOpen((prev) => !prev);
              }}
              tooltip="Manage Tags"
            >
              <Tag size={20} />
            </NoteModalIcon>
            {isTagInputOpen && (
              <TagInputPopover
                onClose={() => setIsTagInputOpen(false)}
                tags={uiTags}
                onTagAdd={addNewTag}
                onTagCheck={toggleTagCheck}
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
