import { TagListItem } from '@/components/layout/tag/tag-list-item.tsx';
import { Route } from '@/routes/_auth/notes/$category/route.tsx';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { api } from '../../../../convex/_generated/api';

export const TagList = ({ dropdown = false }: { dropdown?: boolean }) => {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const allTagsQuery = useQuery(convexQuery(api.tasks.fetchAllTags, {}));

  useEffect(() => {
    if (!allTagsQuery.isSuccess) return;

    const validTagIds = new Set(allTagsQuery.data.map((tag) => tag.id));
    const currentTags = search.tags ?? [];
    const filteredTags = currentTags.filter((tagId) => validTagIds.has(tagId));

    if (filteredTags.length !== currentTags.length) {
      navigate({
        search: {
          ...search,
          tags: filteredTags.length > 0 ? filteredTags : undefined,
        },
      });
    }
  }, [allTagsQuery, navigate, search]);

  const onTagClick = useCallback(
    (tagId: string) => {
      const currentTags = search.tags ?? [];
      const isTagSelected = currentTags.includes(tagId);

      let newTags: string[];

      if (isTagSelected) {
        newTags = currentTags.filter((id) => id !== tagId);
      } else {
        newTags = [...currentTags, tagId];
      }

      navigate({
        search: { ...search, tags: newTags.length > 0 ? newTags : undefined },
      });
    },
    [navigate, search],
  );

  return (
    <div
      className={
        dropdown
          ? 'max-h-80 overflow-y-auto'
          : 'mt-4 min-h-0 grow overflow-y-auto border-t border-zinc-200 pt-4 dark:border-zinc-700'
      }
    >
      <h3 className="mb-2 px-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
        Tags
      </h3>
      <nav>
        <ul>
          {allTagsQuery.isSuccess
            ? allTagsQuery.data.map((tag) => (
                <TagListItem
                  tag={tag}
                  onTagClick={onTagClick}
                  key={tag.id}
                  inlineActions={dropdown}
                />
              ))
            : null}
        </ul>
      </nav>
      {dropdown &&
        (!allTagsQuery.isSuccess ? (
          <p role="status" className="px-3 py-4 text-sm text-zinc-500">
            Loading tags…
          </p>
        ) : allTagsQuery.data.length === 0 ? (
          <p className="px-3 py-4 text-sm text-zinc-500">
            No tags yet. Add tags from a note.
          </p>
        ) : null)}
    </div>
  );
};
