import { ReactNode, useState } from 'react';

import { NoteMoveUndoProvider } from '../feedback/note-move-undo.tsx';
import { NewNoteButton } from './new-note-button.tsx';
import { NoteSearch } from './note-search.tsx';
import { NoteTabs } from './note-tabs.tsx';
import { ProfileMenu } from './profile-menu.tsx';
import { ShortcutHelp } from './shortcut-help';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <NoteMoveUndoProvider>
      <div className="relative flex h-dvh bg-white dark:bg-zinc-950">
        <div className="relative flex min-w-0 flex-1 flex-col">
          <header
            className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between gap-2 px-4 transition-[background-color,backdrop-filter] duration-200 motion-reduce:transition-none md:h-16 md:px-8 ${isScrolled ? 'bg-white/65 backdrop-blur-xl dark:bg-zinc-950/65' : 'bg-transparent'}`}
          >
            <span className="shrink-0 text-xl font-bold text-zinc-800 dark:text-zinc-200">
              Slate
            </span>
            <NoteSearch />
            <ShortcutHelp />
            <ProfileMenu />
          </header>
          <main
            onScroll={(event) =>
              setIsScrolled(event.currentTarget.scrollTop > 0)
            }
            className="min-h-0 w-full min-w-0 flex-1 [scrollbar-gutter:stable_both-edges] overflow-x-hidden overflow-y-auto"
          >
            <NoteTabs />
            {children}
          </main>
          <NewNoteButton />
        </div>
      </div>
    </NoteMoveUndoProvider>
  );
};
