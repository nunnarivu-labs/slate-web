import { Menu } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { Sidebar } from './sidebar.tsx';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = (toggle?: boolean) => {
    setIsSidebarOpen(toggle ?? !isSidebarOpen);
  };

  return (
    <div className="relative flex h-screen bg-white dark:bg-zinc-950">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      {isSidebarOpen && (
        <div
          onClick={() => toggleSidebar()}
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
        />
      )}
      <div className="flex min-w-0 flex-grow flex-col">
        <header className="flex-shrink-0 border-zinc-200 p-4 dark:border-zinc-800">
          <button
            onClick={() => toggleSidebar()}
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            title="Toggle Menu"
          >
            <Menu size={24} />
          </button>
        </header>
        <main className="flex-grow overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
