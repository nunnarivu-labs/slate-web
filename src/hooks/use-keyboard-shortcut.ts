import { useEffect, useRef } from 'react';

type ShortcutOptions = {
  scope?: 'list' | 'editor' | 'overlay' | 'global';
  enabled?: boolean;
  allowTyping?: boolean;
  priority?: number;
};
type Registration = {
  key: string;
  run: () => void;
  options: ShortcutOptions;
};
const registrations = new Set<Registration>();

function isTyping(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
      ),
    )
  );
}

function dispatch(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.repeat ||
    event.isComposing ||
    event.keyCode === 229
  )
    return;
  const overlay = document.querySelector('[data-shortcut-overlay]');
  const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
  for (const registration of [...registrations]
    .reverse()
    .sort((a, b) => (b.options.priority ?? 0) - (a.options.priority ?? 0))) {
    const { key, run, options } = registration;
    if (options.enabled === false) continue;
    if (options.scope !== 'overlay' && overlay) continue;
    if (options.scope === 'list' && dialog) continue;
    if (options.scope === 'editor' && !dialog) continue;
    if (!options.allowTyping && isTyping(event.target)) continue;
    const parts = key.toLowerCase().split('+');
    const mod = parts.includes('mod');
    if (
      event.altKey ||
      (mod ? !(event.metaKey || event.ctrlKey) : event.metaKey || event.ctrlKey)
    )
      continue;
    // A question mark requires Shift on many keyboards.
    if (parts.at(-1) !== '?' && event.shiftKey !== parts.includes('shift'))
      continue;
    if (event.key.toLowerCase() !== parts.at(-1)) continue;
    event.preventDefault();
    // Reserve only matched app commands before ProseMirror consumes them.
    // In particular, it handles Escape and Mod-Enter itself.
    event.stopPropagation();
    run();
    return;
  }
}

export function useKeyboardShortcut(
  key: string,
  run: () => void,
  options: ShortcutOptions = {},
) {
  const latest = useRef({ run, options });
  latest.current = { run, options };
  useEffect(() => {
    const registration: Registration = {
      key,
      run: () => latest.current.run(),
      get options() {
        return latest.current.options;
      },
    };
    if (!registrations.size)
      document.addEventListener('keydown', dispatch, true);
    registrations.add(registration);
    return () => {
      registrations.delete(registration);
      if (!registrations.size)
        document.removeEventListener('keydown', dispatch, true);
    };
  }, [key]);
}

export const shortcutHint = (keys: string) => `⌘/Ctrl + ${keys}`;
