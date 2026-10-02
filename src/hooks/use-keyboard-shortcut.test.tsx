import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { useKeyboardShortcut } from './use-keyboard-shortcut';

afterEach(cleanup);
function Shortcuts({
  list,
  editor,
  overlay,
  open = false,
}: {
  list: () => void;
  editor: () => void;
  overlay: () => void;
  open?: boolean;
}) {
  useKeyboardShortcut('mod+k', list, { scope: 'list' });
  useKeyboardShortcut('mod+enter', editor, {
    scope: 'editor',
    allowTyping: true,
  });
  useKeyboardShortcut('Escape', editor, {
    scope: 'editor',
    allowTyping: true,
    priority: 10,
  });
  useKeyboardShortcut('Escape', overlay, {
    scope: 'overlay',
    enabled: open,
    allowTyping: true,
    priority: 30,
  });
  return null;
}
it('supports either modifier, rejects extra modifiers, typing, repeat, and composition', () => {
  const list = vi.fn();
  const view = render(
    <>
      <Shortcuts list={list} editor={vi.fn()} overlay={vi.fn()} />
      <input />
      <div contentEditable />
    </>,
  );
  fireEvent.keyDown(document, { key: 'k', metaKey: true });
  fireEvent.keyDown(document, { key: 'K', ctrlKey: true });
  expect(list).toHaveBeenCalledTimes(2);
  for (const options of [
    { shiftKey: true },
    { altKey: true },
    { repeat: true },
    { isComposing: true },
  ]) {
    fireEvent.keyDown(document, { key: 'k', metaKey: true, ...options });
  }
  fireEvent.keyDown(view.container.querySelector('input')!, {
    key: 'k',
    metaKey: true,
  });
  fireEvent.keyDown(view.container.querySelector('[contenteditable]')!, {
    key: 'k',
    metaKey: true,
  });
  expect(list).toHaveBeenCalledTimes(2);
  view.unmount();
  fireEvent.keyDown(document, { key: 'k', metaKey: true });
  expect(list).toHaveBeenCalledTimes(2);
});
it('blocks list actions in a modal and allows save from its input', () => {
  const list = vi.fn(),
    editor = vi.fn();
  const view = render(
    <>
      <Shortcuts list={list} editor={editor} overlay={vi.fn()} />
      <div role="dialog" aria-modal="true">
        <input />
      </div>
    </>,
  );
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
  fireEvent.keyDown(view.container.querySelector('input')!, {
    key: 'Enter',
    ctrlKey: true,
  });
  expect(list).not.toHaveBeenCalled();
  expect(editor).toHaveBeenCalledOnce();
});
it('dismisses one overlay before the modal and uses updated handlers', () => {
  const list = vi.fn(),
    editor = vi.fn(),
    overlay = vi.fn(),
    updated = vi.fn();
  const view = render(
    <>
      <Shortcuts list={list} editor={editor} overlay={overlay} open />
      <div role="dialog" aria-modal="true">
        <div data-shortcut-overlay />
      </div>
    </>,
  );
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.keyDown(document, { key: 'Enter', metaKey: true });
  expect(overlay).toHaveBeenCalledOnce();
  expect(editor).not.toHaveBeenCalled();
  view.rerender(
    <>
      <Shortcuts list={list} editor={updated} overlay={overlay} />
      <div role="dialog" aria-modal="true" />
    </>,
  );
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(updated).toHaveBeenCalledOnce();
});
it('preserves question marks in editable fields and editor formatting commands', () => {
  const help = vi.fn(),
    save = vi.fn();
  function Help() {
    useKeyboardShortcut('?', help);
    useKeyboardShortcut('mod+enter', save, { allowTyping: true });
    return <textarea />;
  }
  const view = render(<Help />);
  fireEvent.keyDown(view.container.querySelector('textarea')!, {
    key: '?',
    shiftKey: true,
  });
  fireEvent.keyDown(document, { key: 'b', metaKey: true });
  expect(help).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
  fireEvent.keyDown(document, { key: '?', shiftKey: true });
  expect(help).toHaveBeenCalledOnce();
});
