import { useWindowSize } from '@/hooks/use-window-size.ts';
import { NoteCategory } from '@/types/note-category.ts';
import { Link } from '@tanstack/react-router';
import { Archive, Home, Trash2 } from 'lucide-react';
import { JSX, useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

const tabs: { name: string; category: NoteCategory; Icon: JSX.Element }[] = [
  { name: 'Active', category: 'active', Icon: <Home size={20} /> },
  { name: 'Archive', category: 'archive', Icon: <Archive size={20} /> },
  { name: 'Trash', category: 'trash', Icon: <Trash2 size={20} /> },
];

export const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const width = useWindowSize();
  const isSmallScreen = width <= 576;

  useEffect(() => {
    if (isSmallScreen) {
      onToggle(false);
    }
  }, [isSmallScreen]);

  return (
    <aside
      className={`flex-shrink-0 overflow-hidden bg-zinc-100 transition-all duration-300 ease-in-out dark:bg-zinc-900 ${isOpen ? 'w-64 p-4' : 'w-0 p-0'} `}
    >
      {isOpen && (
        <div className="w-56">
          <h2 className="mb-6 text-xl font-bold text-zinc-800 dark:text-zinc-200">
            Slate
          </h2>
          <nav>
            <ul>
              {tabs.map((tab) => (
                <li>
                  <Link
                    key={tab.category}
                    to="/notes/$category"
                    params={{ category: tab.category }}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    activeProps={{
                      className:
                        'font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50',
                    }}
                  >
                    {tab.Icon}
                    <span>{tab.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </aside>
  );
};
