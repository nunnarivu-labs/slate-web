import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { Tag } from 'lucide-react';

import { api } from '../../../convex/_generated/api';

export const TagList = () => {
  const allTagsQuery = useQuery(convexQuery(api.tasks.fetchAllTags, {}));

  if (!allTagsQuery.isSuccess) return null;

  return (
    <div className="mt-4 min-h-0 flex-grow overflow-y-auto border-t border-zinc-200 pt-4 dark:border-zinc-700">
      <h3 className="mb-2 px-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
        Tags
      </h3>
      <nav>
        <ul>
          {allTagsQuery.data.map((tag) => (
            <li key={tag.id}>
              <a
                href="#"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <Tag size={20} />
                <span>{tag.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
