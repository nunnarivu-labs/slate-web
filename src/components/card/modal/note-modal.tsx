import {
  AiPanel,
  type AiTab,
  type SummaryLength,
} from '@/components/card/modal/ai-panel.tsx';
import { NoteModalIcon } from '@/components/card/modal/note-modal-icon.tsx';
import { NoteTimestamps } from '@/components/card/modal/note-timestamps.tsx';
import { TagInputPopover } from '@/components/card/popover/tag-input-popover.tsx';
import {
  ContentEditor,
  ContentEditorRef,
} from '@/components/content/content-editor.tsx';
import { extractActionItems, suggestTags, summarize } from '@/data/ai.ts';
import {
  shortcutHint,
  useKeyboardShortcut,
} from '@/hooks/use-keyboard-shortcut';
import { observeBrowser } from '@/observability/browser';
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
  Trash,
} from 'lucide-react';
import {
  ChangeEvent,
  RefObject,
  ViewTransition,
  startTransition,
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
  const editorRef = useRef<ContentEditorRef>(null);

  const [isTagInputOpen, setIsTagInputOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [uiTags, setUiTags] = useState<TagWithCheckedStatus[]>([]);
  const [tagsWithStatus, setTagsWithStatus] = useState<TagWithStatus[]>([]);

  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiTab, setAiTab] = useState<AiTab>('summary');
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('brief');
  const [summaries, setSummaries] = useState<
    Partial<Record<SummaryLength, string>>
  >({});
  const [actionItems, setActionItems] = useState('');
  const [processingKey, setProcessingKey] = useState('');
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({});
  const aiRequestPending = useRef(false);

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

  useKeyboardShortcut(
    'Escape',
    () => {
      if (isAiPanelOpen) startTransition(() => setIsAiPanelOpen(false));
      else onClose('save');
    },
    { scope: 'editor', allowTyping: true, priority: 10 },
  );
  const closeTagMenu = () => {
    setIsTagInputOpen(false);
    tagsPopoverRef.current?.querySelector('button')?.focus();
  };
  const closeAiMenu = () => {
    setIsAiMenuOpen(false);
    aiMenuRef.current?.querySelector('button')?.focus();
  };
  useKeyboardShortcut('Escape', closeTagMenu, {
    scope: 'overlay',
    enabled: isTagInputOpen,
    allowTyping: true,
    priority: 30,
  });
  useKeyboardShortcut('Escape', closeAiMenu, {
    scope: 'overlay',
    enabled: isAiMenuOpen,
    allowTyping: true,
    priority: 30,
  });
  useKeyboardShortcut('mod+enter', () => onClose('save'), {
    scope: 'editor',
    allowTyping: true,
  });
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNote((prev) => ({ ...prev, title: e.target.value }));
    setIsDirty(true);
  };

  const handleContentChange = (md: string | undefined) => {
    setNote((prev) => ({ ...prev, content: md ?? '' }));
    setIsDirty(true);
  };

  useImperativeHandle(
    ref,
    () => ({
      get note() {
        return {
          ...note,
          content: editorRef.current?.getMarkdown() ?? note.content,
        };
      },
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

  const generateAiResult = useCallback(
    async (tab: AiTab, length: SummaryLength = summaryLength) => {
      if (aiRequestPending.current) return;
      aiRequestPending.current = true;
      const key = tab === 'summary' ? length : 'actions';
      setIsAiProcessing(true);
      setProcessingKey(key);
      setAiErrors((prev) => ({ ...prev, [key]: '' }));
      try {
        const content = await observeBrowser(
          `browser.ai.${tab === 'summary' ? 'summarize' : 'extract_action_items'}`,
          () =>
            tab === 'summary'
              ? summarizeFn({
                  data: {
                    note: editorRef.current?.getMarkdown() ?? note.content,
                    length,
                  },
                })
              : extractActionItemsFn({
                  data: {
                    note: editorRef.current?.getMarkdown() ?? note.content,
                  },
                }),
        );
        if (!content?.trim()) throw new Error('Empty result');
        if (tab === 'summary')
          setSummaries((prev) => ({ ...prev, [length]: content }));
        else setActionItems(content);
      } catch {
        setAiErrors((prev) => ({
          ...prev,
          [key]: 'Could not generate a result. Please try again.',
        }));
      } finally {
        aiRequestPending.current = false;
        setIsAiProcessing(false);
        setProcessingKey('');
      }
    },
    [note.content, summarizeFn, extractActionItemsFn, summaryLength],
  );

  // If the user switches tabs during a request, generate the newly selected
  // result after that request finishes instead of leaving an empty tab.
  useEffect(() => {
    const key = aiTab === 'summary' ? summaryLength : 'actions';
    const result = aiTab === 'summary' ? summaries[summaryLength] : actionItems;
    if (isAiPanelOpen && !isAiProcessing && !result && !aiErrors[key]) {
      void generateAiResult(aiTab);
    }
  }, [
    isAiPanelOpen,
    isAiProcessing,
    aiTab,
    summaryLength,
    summaries,
    actionItems,
    aiErrors,
    generateAiResult,
  ]);

  const openAiTab = (tab: AiTab) => {
    setIsAiMenuOpen(false);
    setAiTab(tab);
    startTransition(() => setIsAiPanelOpen(true));
    if (!(tab === 'summary' ? summaries[summaryLength] : actionItems)) {
      void generateAiResult(tab);
    }
  };

  const changeSummaryLength = (length: SummaryLength) => {
    setSummaryLength(length);
    if (!summaries[length]) void generateAiResult('summary', length);
  };

  const handleSuggestTags = useCallback(
    async (tags: string[]) => {
      const content = await observeBrowser('browser.ai.suggest_tags', () =>
        suggestTagsFn({
          data: {
            note: note.content,
            tags,
          },
        }),
      );

      return content.tags;
    },
    [note.content, uiTags, suggestTagsFn],
  );

  const onInsertAiContent = useCallback((content: string) => {
    editorRef.current?.appendMarkdown(content);
    setIsDirty(true);
  }, []);

  const isNoteTooShort = note.content.length < 100;

  return (
    <div className="relative flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <ViewTransition default="none" update="note-editor">
          <div className="note-modal-content flex min-h-0 grow flex-col px-4 pt-4 pb-1">
            <input
              id="note-modal-title"
              type="text"
              value={note.title}
              onChange={handleTitleChange}
              placeholder="Title"
              className="mb-4 w-full shrink-0 bg-transparent text-lg font-semibold text-zinc-800 outline-none dark:text-zinc-200"
            />
            <div className="flex min-h-0 grow flex-col">
              <ContentEditor
                ref={editorRef}
                content={note.content}
                onChange={handleContentChange}
                autofocusEnd
                placeholder="Take a note..."
              />
            </div>
          </div>
        </ViewTransition>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 px-2 pt-1 pb-2">
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
            <div
              ref={tagsPopoverRef}
              data-shortcut-overlay={isTagInputOpen ? '' : undefined}
              className="relative"
            >
              <NoteModalIcon
                disabled={isNoteEmpty}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setIsAiMenuOpen(false);
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
            <div
              ref={aiMenuRef}
              data-shortcut-overlay={isAiMenuOpen ? '' : undefined}
              className="relative"
            >
              <NoteModalIcon
                onClick={() => {
                  setIsTagInputOpen(false);
                  setIsAiMenuOpen((prev) => !prev);
                }}
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
                    onClick={() => openAiTab('summary')}
                    disabled={isNoteTooShort}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-600"
                  >
                    <FileText size={16} />
                    <span>Summarize note</span>
                  </button>
                  <button
                    onClick={() => openAiTab('actions')}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-600"
                  >
                    <CheckSquare size={16} />
                    <span>Extract action items</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {currentNote && (
              <NoteTimestamps
                createdAt={currentNote.createdAt}
                updatedAt={currentNote.updatedAt}
              />
            )}
            <button
              onClick={() => onClose('save')}
              title={`Save and close (${shortcutHint('Enter')})`}
              className="cursor-pointer rounded px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {isAiPanelOpen && (
        <ViewTransition
          default="none"
          enter="note-ai-panel"
          exit="note-ai-panel"
        >
          <AiPanel
            tab={aiTab}
            onTabChange={openAiTab}
            summaryLength={summaryLength}
            onSummaryLengthChange={changeSummaryLength}
            summary={summaries[summaryLength] ?? ''}
            actionItems={actionItems}
            isProcessing={isAiProcessing}
            isLoading={
              processingKey ===
              (aiTab === 'summary' ? summaryLength : 'actions')
            }
            error={
              aiErrors[aiTab === 'summary' ? summaryLength : 'actions'] ?? ''
            }
            onRegenerate={() => void generateAiResult(aiTab)}
            onClose={() => startTransition(() => setIsAiPanelOpen(false))}
            onInsert={onInsertAiContent}
          />
        </ViewTransition>
      )}
    </div>
  );
};
