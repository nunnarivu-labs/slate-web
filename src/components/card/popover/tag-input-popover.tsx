import { Tag, TagWithCheckedStatus, TagWithStatus } from '@/types/tag.ts';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { X } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

interface TagInputPopoverProps {
  onAddTag: (tag: string) => void;
  onClose: () => void;
}

export const TagInputPopover = ({ onClose }: TagInputPopoverProps) => {
  const [tag, setTag] = useState('');
  const [allUiTags, setAllUiTags] = useState<TagWithCheckedStatus[]>([]);
  const [_, setNoteTagsWithStatus] = useState<TagWithStatus[]>([]);

  const tagInputRef = useRef<HTMLInputElement>(null);

  const params = useParams({ from: '/_auth/notes/$category/$id' });

  const allTagsQuery = useQuery(convexQuery(api.tasks.fetchAllTags, {}));
  const noteTagsQuery = useQuery(
    convexQuery(
      api.tasks.fetchNoteTags,
      params.id === 'new' ? 'skip' : { noteId: params.id as Id<'notes'> },
    ),
  );

  useEffect(() => {
    if (allTagsQuery.isSuccess) {
      setAllUiTags(allTagsQuery.data.map((t) => ({ ...t, checked: false })));
    }
  }, [allTagsQuery.isSuccess, allTagsQuery.data]);

  useEffect(() => {
    if (noteTagsQuery.isSuccess) {
      setAllUiTags((prev) =>
        prev.map((t) => ({
          ...t,
          checked: !!noteTagsQuery.data.find((nt) => nt.id === t.id),
        })),
      );
      setNoteTagsWithStatus(
        noteTagsQuery.data.map((ntq) => ({ ...ntq, status: 'ALREADY_ADDED' })),
      );
    }
  }, [noteTagsQuery.isSuccess, noteTagsQuery.data]);

  const filteredAllTags: TagWithCheckedStatus[] = useMemo(() => {
    if (allUiTags.length === 0) return [];
    if (!tag) return allUiTags;
    return allUiTags.filter(
      (t) => t.name.toLocaleLowerCase().search(tag.toLowerCase()) !== -1,
    );
  }, [allUiTags, tag]);

  const tagHasExactMatch: boolean = useMemo(() => {
    if (!allTagsQuery.isSuccess) return false;
    if (!tag) return false;
    return allTagsQuery.data.some((t) => t.name === tag);
  }, [allTagsQuery.isSuccess, allTagsQuery.data, tag]);

  const addNewTag = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (tag.trim()) {
        const newTag: Tag = {
          id: Math.random().toString(36),
          name: tag.trim(),
        };

        setAllUiTags((prev) => [{ ...newTag, checked: true }, ...prev]);

        setNoteTagsWithStatus((prev) => [
          ...prev,
          { ...newTag, status: 'NEWLY_CREATED' },
        ]);

        setTag('');

        tagInputRef.current?.focus();
      }
    },
    [tag],
  );

  const toggleTagCheck = useCallback((tagId: string) => {
    setAllUiTags((prev) => {
      return prev.map((t) => {
        return t.id !== tagId ? t : { ...t, checked: !t.checked };
      });
    });
  }, []);

  console.log(allUiTags);
  console.log(filteredAllTags);

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
          className="w-full flex-grow rounded-md bg-zinc-100 px-2 py-1 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
          autoFocus
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!tag || tagHasExactMatch}
        >
          Add
        </button>
      </form>
      {filteredAllTags.length > 0 ? (
        <div className="mt-3 border-t pt-2 dark:border-zinc-600">
          <h4 className="mb-1 px-1 text-xs font-bold text-zinc-500 uppercase dark:text-zinc-400">
            Existing Tags
          </h4>
          <div className="max-h-52 overflow-y-auto pr-1">
            <div className="space-y-1">
              {allTagsQuery.isSuccess && noteTagsQuery.isSuccess
                ? filteredAllTags.map((t) => (
                    <label
                      key={t.id}
                      className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-600"
                    >
                      <input
                        onChange={() => toggleTagCheck(t.id)}
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
