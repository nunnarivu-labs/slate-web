import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { useUser } from '@clerk/shared/react';
import { UserRound } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Logout } from './logout';

export const ProfileMenu = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const closeOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node))
        setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, [isOpen]);

  useKeyboardShortcut(
    'Escape',
    () => {
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    { scope: 'overlay', enabled: isOpen, allowTyping: true, priority: 20 },
  );

  return (
    <div ref={containerRef} className="pointer-events-auto relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Profile"
        title="Profile"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-zinc-600 hover:ring-2 hover:ring-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:ring-zinc-700"
      >
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <UserRound size={20} />
        )}
      </button>
      {isOpen && (
        <div
          id={panelId}
          data-shortcut-overlay
          className="profile-menu-panel absolute top-full right-0 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="mb-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
            <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {user?.fullName || user?.username || 'Your profile'}
            </p>
            {user?.primaryEmailAddress?.emailAddress && (
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {user.primaryEmailAddress.emailAddress}
              </p>
            )}
          </div>
          <Logout onLogout={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};
