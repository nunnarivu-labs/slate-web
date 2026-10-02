import { Menu } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { NoteMoveUndoProvider } from '../feedback/note-move-undo.tsx';
import { NewNoteButton } from './new-note-button.tsx';
import { NoteSearch } from './note-search.tsx';
import { Sidebar } from './sidebar.tsx';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleSidebar = (toggle?: boolean) => {
    setIsSidebarOpen(toggle ?? !isSidebarOpen);
  };

  return (
    <NoteMoveUndoProvider>
      <div className="relative flex h-dvh bg-white dark:bg-zinc-950">
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        {isSidebarOpen && (
          <div
            onClick={() => toggleSidebar()}
            className="fixed inset-0 z-10 bg-black/50 md:hidden"
          />
        )}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <header
            className={`pointer-events-none absolute inset-x-0 top-0 z-[1] flex h-14 items-center justify-between gap-2 px-4 transition-[background-color,backdrop-filter] duration-200 motion-reduce:transition-none md:h-16 md:px-8 ${isScrolled ? 'bg-white/65 backdrop-blur-xl dark:bg-zinc-950/65' : 'bg-transparent'}`}
          >
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={isSidebarOpen}
              onClick={() => toggleSidebar()}
              className="pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="Toggle Menu"
            >
              <Menu size={24} />
            </button>
            <NoteSearch />
            <NewNoteButton />
          </header>
          <main
            onScroll={(event) =>
              setIsScrolled(event.currentTarget.scrollTop > 0)
            }
            className="min-h-0 w-full min-w-0 flex-1 [scrollbar-gutter:stable_both-edges] overflow-x-hidden overflow-y-auto"
          >
            {children}
          </main>
        </div>
      </div>
    </NoteMoveUndoProvider>
  );
};
