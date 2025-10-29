import { TagWithStatus } from '@/types/tag.ts';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

interface TagInputPopoverProps {
  onAddTag: (tag: string) => void;
  onClose: () => void;
}

export const TagInputPopover = ({
  onAddTag,
  onClose,
}: TagInputPopoverProps) => {
  const [tag, setTag] = useState('');
  const [noteTags, setNoteTags] = useState<TagWithStatus[]>([]);

  const params = useParams({ from: '/_auth/notes/$category/$id' });

  const allTagsQuery = useQuery(convexQuery(api.tasks.fetchAllTags, {}));
  const noteTagsQuery = useQuery(
    convexQuery(
      api.tasks.fetchNoteTags,
      params.id === 'new' ? 'skip' : { noteId: params.id as Id<'notes'> },
    ),
  );

  useEffect(() => {
    if (noteTagsQuery.isSuccess) {
      setNoteTags(
        noteTagsQuery.data.map((noteTag) => ({
          ...noteTag,
          status: 'ALREADY_ADDED',
        })),
      );
    }
  }, [noteTagsQuery.isSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tag.trim()) {
      onAddTag(tag.trim());
      setTag('');
    }
  };

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
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          id="tag-input"
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="e.g., #work, #ideas"
          className="w-full flex-grow rounded-md bg-zinc-100 px-2 py-1 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:text-zinc-100"
          autoFocus
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Add
        </button>
      </form>
      <div className="mt-3 border-t pt-2 dark:border-zinc-600">
        <h4 className="mb-1 px-1 text-xs font-bold text-zinc-500 uppercase dark:text-zinc-400">
          Existing Tags
        </h4>
        <div className="max-h-52 overflow-y-auto pr-1">
          <div className="space-y-1">
            {allTagsQuery.isSuccess && noteTagsQuery.isSuccess
              ? allTagsQuery.data.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-600"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={false}
                      checked={!!noteTags.find((nt) => nt.id === tag.id)}
                      className="h-4 w-4 rounded border-gray-300 accent-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-zinc-700 dark:text-zinc-200">
                      {tag.name}
                    </span>
                  </label>
                ))
              : null}
          </div>
        </div>
      </div>
    </div>
  );
};
