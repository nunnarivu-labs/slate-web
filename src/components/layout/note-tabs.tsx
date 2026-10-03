import { NoteCategory } from '@/types/note-category.ts';
import { Link, useParams, useSearch } from '@tanstack/react-router';
import { Archive, Home, Trash2 } from 'lucide-react';

import { TagDropdown } from './tag/tag-dropdown';

const tabs = [
  { name: 'Active', category: 'active', Icon: Home },
  { name: 'Archive', category: 'archive', Icon: Archive },
  { name: 'Trash', category: 'trash', Icon: Trash2 },
] satisfies { name: string; category: NoteCategory; Icon: typeof Home }[];

export const NoteTabs = () => {
  const { category } = useParams({ from: '/_auth/notes/$category' });
  const search = useSearch({ from: '/_auth/notes/$category' });

  return (
    <nav aria-label="Note views" className="px-4 pt-20 md:px-8 md:pt-22">
      <div className="flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map(({ name, category: tabCategory, Icon }) => (
          <Link
            key={tabCategory}
            to="/notes/$category"
            params={{ category: tabCategory }}
            search={search}
            aria-current={category === tabCategory ? 'page' : undefined}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 md:px-4 ${
              category === tabCategory
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200'
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            {name}
          </Link>
        ))}
        <TagDropdown />
      </div>
    </nav>
  );
};
