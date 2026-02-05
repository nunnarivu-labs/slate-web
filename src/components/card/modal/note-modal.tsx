import { NoteModalIcon } from '@/components/card/modal/note-modal-icon.tsx';
import { SummaryDisplay } from '@/components/card/modal/summary-display.tsx';
import { TagInputPopover } from '@/components/card/popover/tag-input-popover.tsx';
import { ContentEditor } from '@/components/content/content-editor.tsx';
import { Markdown } from '@/components/content/markdown.tsx';
import { extractActionItems, suggestTags, summarize } from '@/data/ai.ts';
import { Route } from '@/routes/_auth/notes/$category/$id.tsx';
import { NoteModalRef } from '@/types/note-modal-ref.ts';
import { NoteSaveActionType } from '@/types/note-save-action.ts';
import { Note } from '@/types/note.ts';
import { Tag as TagType } from '@/types/tag.ts';
import { TagWithCheckedStatus, TagWithStatus } from '@/types/tag.ts';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import {
  Archive,
  CheckSquare,
  FileText,
  Home,
  Loader2,
  Sparkles,
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
  const summarizeFn = useServerFn(summarize);
  const extractActionItemsFn = useServerFn(extractActionItems);
  const suggestTagsFn = useServerFn(suggestTags);

  const params = Route.useParams();

  const aiMenuRef = useRef<HTMLDivElement>(null);
  const tagsPopoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isTagInputOpen, setIsTagInputOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [uiTags, setUiTags] = useState<TagWithCheckedStatus[]>([]);
  const [tagsWithStatus, setTagsWithStatus] = useState<TagWithStatus[]>([]);

  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const [aiContent, setAiContent] = useState('');

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

  const focusEnd = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        note.content.length,
        note.content.length,
      );
    }
  }, [note.content]);

  useEffect(() => {
    focusEnd();
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | KeyboardEvent) => {
      if (
        aiMenuRef.current &&
        !aiMenuRef.current.contains(event.target as Node)
      ) {
        setIsAiMenuOpen(false);
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

  const handleSummarize = useCallback(async () => {
    setIsAiMenuOpen(false);
    setIsAiProcessing(true);

    try {
      const content = await summarizeFn({ data: { note: note.content } });

      if (content) {
        setAiContent(content);
      }
    } finally {
      setIsAiProcessing(false);
    }
  }, [note.content, summarizeFn]);

  const handleExtractActionItems = useCallback(async () => {
    setIsAiMenuOpen(false);
    setIsAiProcessing(true);

    try {
      const content = await extractActionItemsFn({
        data: { note: note.content },
      });

      if (content) {
        setAiContent(content);
      }
    } finally {
      setIsAiProcessing(false);
    }
  }, [note.content, extractActionItemsFn]);

  const handleSuggestTags = useCallback(
    async (tags: string[]) => {
      const content = await suggestTagsFn({
        data: {
          note: note.content,
          tags,
        },
      });

      return content.tags;
    },
    [note.content, uiTags, suggestTagsFn],
  );

  const onInsertAiContent = useCallback(
    (content: string) => {
      setNote((prev) => ({ ...prev, content: prev.content + content }));
      setAiContent('');

      focusEnd();
    },
    [focusEnd],
  );

  const isNoteTooShort = note.content.length < 100;

  return (
    <>
      {aiContent ? (
        <SummaryDisplay
          summaryText={aiContent}
          onClose={() => setAiContent('')}
          onInsert={onInsertAiContent}
        />
      ) : null}
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
            ref={textareaRef}
            content={note.content}
            onChange={handleContentChange}
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
                onAiTagSuggest={handleSuggestTags}
              />
            )}
          </div>
          <div ref={aiMenuRef} className="relative">
            <NoteModalIcon
              onClick={() => setIsAiMenuOpen((prev) => !prev)}
              disabled={isAiProcessing}
              tooltip="AI Actions"
            >
              {isAiProcessing ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Sparkles size={20} />
              )}
            </NoteModalIcon>
            {isAiMenuOpen ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-full left-1/2 mb-2 w-56 -translate-x-1/2 rounded-lg border bg-white p-2 shadow-xl md:translate-x-0 dark:border-zinc-600 dark:bg-zinc-700"
              >
                <button
                  onClick={handleSummarize}
                  disabled={isNoteTooShort}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-600"
                >
                  <FileText size={16} />
                  <span>Summarize note</span>
                </button>
                <button
                  onClick={handleExtractActionItems}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-600"
                >
                  <CheckSquare size={16} />
                  <span>Extract action items</span>
                </button>
              </div>
            ) : null}
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
