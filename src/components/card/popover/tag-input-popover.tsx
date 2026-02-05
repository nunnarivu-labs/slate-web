import { NoteModalIcon } from '@/components/card/modal/note-modal-icon.tsx';
import { TagWithCheckedStatus } from '@/types/tag.ts';
import { Loader2, Sparkles, X } from 'lucide-react';
import { FormEvent, useCallback, useMemo, useRef, useState } from 'react';

type TagInputPopoverProps = {
  onClose: () => void;
  onTagAdd: (tag: string) => void;
  onTagCheck: (tagId: string, checked: boolean) => void;
  onAiTagSuggest: (tags: string[]) => Promise<string[]>;
  tags: TagWithCheckedStatus[];
};

export const TagInputPopover = ({
  onClose,
  tags,
  onTagAdd,
  onTagCheck,
  onAiTagSuggest,
}: TagInputPopoverProps) => {
  const [tag, setTag] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const tagInputRef = useRef<HTMLInputElement>(null);

  const filteredAllTags: TagWithCheckedStatus[] = useMemo(() => {
    if (tags.length === 0) return [];
    if (!tag) return tags;
    return tags.filter(
      (t) => t.name.toLocaleLowerCase().search(tag.toLowerCase()) !== -1,
    );
  }, [tags, tag]);

  const tagHasExactMatch: boolean = useMemo(() => {
    if (tags.length === 0) return false;
    if (!tag) return false;
    return tags.some((t) => t.name === tag);
  }, [tags, tag]);

  const suggestTags = useCallback(async () => {
    try {
      setIsAiProcessing(true);
      setSuggestedTags(await onAiTagSuggest(tags.map((t) => t.name)));
    } finally {
      setIsAiProcessing(false);
    }
  }, [onAiTagSuggest, tags]);

  const addNewTag = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      onTagAdd(tag);

      setTag('');
      tagInputRef.current?.focus();
    },
    [tag],
  );

  const toggleTagCheck = useCallback(
    (tagId: string, checked: boolean) => onTagCheck(tagId, checked),
    [onTagCheck],
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-8 left-1/2 mb-2 w-64 max-w-[90vw] -translate-x-1/2 rounded-lg border bg-white p-3 shadow-xl md:right-auto md:left-auto md:w-64 md:translate-x-0 dark:border-zinc-600 dark:bg-zinc-700"
    >
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor="tag-input"
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
        >
          Add a tag
        </label>
        <button
          onClick={onClose}
          className="rounded-full p-1 hover:bg-zinc-200 dark:hover:bg-zinc-600"
        >
          <X size={16} />
        </button>
      </div>
      <form onSubmit={addNewTag} className="flex gap-2">
        <input
          ref={tagInputRef}
          id="tag-input"
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="e.g., work, ideas"
          className="w-full grow rounded-md bg-zinc-100 px-2 py-1 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
          autoFocus
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!tag || tagHasExactMatch}
        >
          Add
        </button>
        <NoteModalIcon
          onClick={suggestTags}
          disabled={isAiProcessing}
          tooltip="Suggest tags with AI"
        >
          {isAiProcessing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
        </NoteModalIcon>
      </form>
      {suggestedTags.length > 0 ? (
        <div className="mt-3 border-t pt-2 dark:border-zinc-600">
          <h4 className="mb-2 px-1 text-xs font-bold text-zinc-500 uppercase dark:text-zinc-400">
            Suggested Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((suggestedTag) => {
              const existingTag = tags.find((tag) => tag.name === suggestedTag);
              const isSelected = !existingTag ? false : existingTag.checked;

              return (
                <button
                  key={suggestedTag}
                  onClick={() => {
                    if (existingTag)
                      toggleTagCheck(existingTag.id, !existingTag.checked);
                    else onTagAdd(suggestedTag);
                  }}
                  type="button"
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-600'
                  } `}
                >
                  {suggestedTag}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {filteredAllTags.length > 0 ? (
        <div className="mt-3 border-t pt-2 dark:border-zinc-600">
          <h4 className="mb-1 px-1 text-xs font-bold text-zinc-500 uppercase dark:text-zinc-400">
            Existing Tags
          </h4>
          <div className="max-h-52 overflow-y-auto pr-1">
            <div className="space-y-1">
              {filteredAllTags.length > 0
                ? filteredAllTags.map((t) => (
                    <label
                      key={t.id}
                      className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-600"
                    >
                      <input
                        onChange={() => toggleTagCheck(t.id, !t.checked)}
                        type="checkbox"
                        defaultChecked={false}
                        checked={t.checked}
                        className="h-4 w-4 rounded border-gray-300 accent-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-zinc-700 dark:text-zinc-200">
                        {t.name}
                      </span>
                    </label>
                  ))
                : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
