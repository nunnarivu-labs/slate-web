import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { NoteCard } from './note-card';

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  },
);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('keeps the full source available and opens a truncated preview without a Read more label', () => {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(224);
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(400);
  const open = vi.fn();
  render(
    <NoteCard
      note={{
        id: '1',
        title: 'Long note',
        content: 'Full original content',
        category: 'active',
      }}
      onMove={vi.fn()}
      onClick={open}
    />,
  );
  expect(screen.queryByText('Read more')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Open Long note' }));
  expect(open).toHaveBeenCalledOnce();
  expect(screen.getByText('Full original content')).toBeTruthy();
});

it('does not add a Read more cue to a short note', () => {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40);
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(40);
  render(
    <NoteCard
      note={{
        id: '1',
        title: 'Short note',
        content: 'Short content',
        category: 'active',
      }}
      onMove={vi.fn()}
      onClick={vi.fn()}
    />,
  );
  expect(screen.queryByText('Read more')).toBeNull();
});

it('moves a note without opening the editor and hides the current category action', async () => {
  const open = vi.fn();
  const move = vi.fn().mockResolvedValue(undefined);
  render(
    <NoteCard
      note={{
        id: '1',
        title: 'Quick actions',
        content: 'Content',
        category: 'active',
      }}
      onClick={open}
      onMove={move}
    />,
  );
  expect(screen.queryByRole('button', { name: 'Move to Active' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Archive note' }));
  expect(move).toHaveBeenCalledWith('archive');
  expect(open).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(
      (
        screen.getByRole('button', {
          name: 'Archive note',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
});

it('offers restoration from Trash without a permanent delete action', () => {
  render(
    <NoteCard
      note={{
        id: '1',
        title: 'Trashed note',
        content: 'Content',
        category: 'trash',
      }}
      onClick={vi.fn()}
      onMove={vi.fn()}
    />,
  );
  expect(screen.getByRole('button', { name: 'Move to Active' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Archive note' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Move to Trash' })).toBeNull();
});

it('shows a recoverable move error and re-enables the actions', async () => {
  const move = vi
    .fn()
    .mockRejectedValueOnce(new Error('Connection failed'))
    .mockResolvedValueOnce(undefined);
  render(
    <NoteCard
      note={{
        id: '1',
        title: 'Quick actions',
        content: 'Content',
        category: 'archive',
      }}
      onClick={vi.fn()}
      onMove={move}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Move to Trash' }));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Move to Trash' }));
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(move).toHaveBeenCalledTimes(2);
});
