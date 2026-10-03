import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ChevronDown, Tag } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { TagList } from './tag-list';

export const TagDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const search = useSearch({ from: '/_auth/notes/$category' });
  const navigate = useNavigate({ from: '/notes/$category' });
  const selectedCount = search.tags?.length ?? 0;

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
    <div ref={containerRef} className="relative ml-auto self-center">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-800 ${selectedCount ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'}`}
      >
        <Tag size={16} aria-hidden="true" />
        Tags{selectedCount > 0 ? ` (${selectedCount})` : ''}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={isOpen ? 'rotate-180' : ''}
        />
      </button>
      {isOpen && (
        <div
          id={panelId}
          data-shortcut-overlay
          className="tag-dropdown-panel absolute top-full right-0 z-10 mt-2 w-[min(20rem,calc(100vw-3rem))] rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {selectedCount > 0 && (
            <div className="flex justify-end px-3 pb-1">
              <button
                type="button"
                onClick={() =>
                  void navigate({ search: { ...search, tags: undefined } })
                }
                className="rounded px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-blue-400 dark:hover:bg-zinc-800"
              >
                Clear all
              </button>
            </div>
          )}
          <TagList dropdown />
        </div>
      )}
    </div>
  );
};
