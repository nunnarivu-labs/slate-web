import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { NewNoteButton } from './new-note-button';
import { NoteSearch } from './note-search';
import { ShortcutHelp } from './shortcut-help';

const router = vi.hoisted(() => ({ navigate: vi.fn(), category: 'active' }));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => router.navigate,
  useParams: () => ({ category: router.category }),
  useSearch: () => ({ tags: ['tag1'] }),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  router.navigate.mockReset();
  router.category = 'active';
});
it('creates a note with filters and disables the shortcut in Trash', () => {
  const view = render(<NewNoteButton />);
  fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true, shiftKey: true });
  expect(router.navigate).toHaveBeenCalledWith({
    to: '/notes/$category/$id',
    params: { category: 'active', id: 'new' },
    search: { tags: ['tag1'] },
  });
  router.category = 'trash';
  view.rerender(<NewNoteButton />);
  fireEvent.keyDown(document, { key: 'Enter', metaKey: true, shiftKey: true });
  expect(router.navigate).toHaveBeenCalledOnce();
});
it('expands and focuses search through its shortcut', () => {
  let focus: FrameRequestCallback = () => {};
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    focus = callback;
    return 1;
  });
  render(<NoteSearch />);
  fireEvent.keyDown(document, { key: 'k', metaKey: true });
  act(() => focus(0));
  expect(document.activeElement).toBe(screen.getByRole('searchbox'));
});
it('opens help, contains Tab focus, blocks note creation, and restores focus on Escape', () => {
  let focus: FrameRequestCallback = () => {};
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    focus = callback;
    return 1;
  });
  render(
    <>
      <ShortcutHelp />
      <NewNoteButton />
    </>,
  );
  const trigger = screen.getByRole('button', { name: 'Keyboard shortcuts' });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: '?', shiftKey: true });
  act(() => focus(0));
  const close = screen.getByRole('button', {
    name: 'Close keyboard shortcuts',
  });
  expect(document.activeElement).toBe(close);
  fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(close);
  fireEvent.keyDown(close, { key: 'Enter', metaKey: true, shiftKey: true });
  expect(router.navigate).not.toHaveBeenCalled();
  fireEvent.keyDown(close, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
