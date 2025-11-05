import { DropdownMenu } from '@/components/dropdown-menu.tsx';
import { TagListItemEdit } from '@/components/layout/tag/tag-list-item-edit.tsx';
import { Route } from '@/routes/_auth/notes/$category/route.tsx';
import { Tag as TagType } from '@/types/tag.ts';
import { useMutation } from 'convex/react';
import { MoreHorizontal, Tag } from 'lucide-react';
import { useRef, useState } from 'react';

import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

type TagListItemProps = {
  tag: TagType;
  onTagClick: (tagId: string) => void;
};

export const TagListItem = ({ tag, onTagClick }: TagListItemProps) => {
  const deleteTagMutation = useMutation(api.tasks.deleteTag);

  const search = Route.useSearch();
  const isSelected = search.tags?.includes(tag.id) ?? false;

  const [isEditing, setIsEditing] = useState(false);

  const menuRef = useRef<HTMLLIElement>(null);

  const menuTrigger = (
    <button className="rounded-md p-1 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700">
      <MoreHorizontal size={16} />
    </button>
  );

  return (
    <li
      ref={menuRef}
      className={`group relative mb-1 flex items-center justify-between rounded-md px-3 py-1 ${isSelected && !isEditing ? 'bg-blue-100 dark:bg-blue-900/50' : ''} ${!isEditing ? 'hover:bg-zinc-200 dark:hover:bg-zinc-800' : ''} `}
    >
      {isEditing ? (
        <TagListItemEdit tag={tag} onEditDone={() => setIsEditing(false)} />
      ) : (
        <button
          type="button"
          onClick={() => onTagClick(tag.id)}
          className={`flex flex-grow items-center gap-3 py-1 ${isSelected ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'} `}
        >
          <Tag size={20} />
          <span>{tag.name}</span>
        </button>
      )}
      <DropdownMenu trigger={menuTrigger}>
        <button
          onClick={() => setIsEditing(true)}
          className="w-full rounded px-2 py-1 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-600"
        >
          Edit
        </button>
        {!isSelected && (
          <button
            onClick={async () =>
              await deleteTagMutation({ id: tag.id as Id<'tags'> })
            }
            className="w-full rounded px-2 py-1 text-left text-sm text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-600"
          >
            Delete
          </button>
        )}
      </DropdownMenu>
    </li>
  );
};
