import {
  shortcutHint,
  useKeyboardShortcut,
} from '@/hooks/use-keyboard-shortcut';
import { Keyboard, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Portal } from '../portal';

const shortcuts = [
  [shortcutHint('K'), 'Search notes', 'Notes list'],
  [shortcutHint('Shift + Enter'), 'New note', 'Notes list, except Trash'],
  [shortcutHint('Enter'), 'Save and close', 'Note editor'],
  [shortcutHint('Shift + P'), 'Toggle preview', 'Nonempty note editor'],
  ['Escape', 'Close the topmost menu, panel, or modal', 'Everywhere'],
  ['?', 'Keyboard shortcuts', 'When not typing'],
];

export function ShortcutHelp() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useKeyboardShortcut('?', () => setOpen(true), { scope: 'global' });
  useKeyboardShortcut('Escape', () => setOpen(false), {
    scope: 'overlay',
    enabled: open,
    allowTyping: true,
    priority: 100,
  });
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    // Portal mounts in an effect; defer focus until its contents exist.
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);
  return (
    <>
      <button
        type="button"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (?)"
        onClick={() => setOpen(true)}
        className="pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <Keyboard size={20} />
      </button>
      {open && (
        <Portal>
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="shortcut-help-title"
              data-shortcut-overlay
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === 'Tab') {
                  event.preventDefault();
                  closeRef.current?.focus();
                }
              }}
              className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 text-zinc-800 shadow-xl dark:bg-zinc-800 dark:text-zinc-100"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 id="shortcut-help-title" className="text-lg font-semibold">
                  Keyboard shortcuts
                </h2>
                <button
                  ref={closeRef}
                  type="button"
                  aria-label="Close keyboard shortcuts"
                  onClick={() => setOpen(false)}
                  className="rounded p-2 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-700"
                >
                  <X size={20} />
                </button>
              </div>
              <dl className="space-y-4">
                {shortcuts.map(([key, action, scope]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-4"
                  >
                    <div>
                      <dt className="text-sm font-medium">{action}</dt>
                      <dd className="text-xs text-zinc-500 dark:text-zinc-400">
                        {scope}
                      </dd>
                    </div>
                    <kbd className="shrink-0 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600">
                      {key}
                    </kbd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
