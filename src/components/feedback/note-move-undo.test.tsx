import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import type { Id } from '../../../convex/_generated/dataModel';
import { NoteMoveUndoProvider, useNoteMoveUndo } from './note-move-undo';

const { undoMove } = vi.hoisted(() => ({ undoMove: vi.fn() }));
vi.mock('convex/react', () => ({ useMutation: () => undoMove }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  undoMove.mockReset();
});

function OfferMove() {
  const offer = useNoteMoveUndo();
  return (
    <>
      <button
        onClick={() =>
          offer({
            noteId: 'note1' as Id<'notes'>,
            previousCategory: 'active',
            category: 'archive',
          })
        }
      >
        Archive
      </button>
      <button
        onClick={() =>
          offer({
            noteId: 'note1' as Id<'notes'>,
            previousCategory: 'archive',
            category: 'trash',
          })
        }
      >
        Trash
      </button>
    </>
  );
}
function setup() {
  render(
    <NoteMoveUndoProvider>
      <OfferMove />
    </NoteMoveUndoProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
}

it('undoes only the category and shows confirmation after the mutation succeeds', async () => {
  undoMove.mockResolvedValue(true);
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(undoMove).toHaveBeenCalledWith({
    id: 'note1',
    previousCategory: 'active',
    expectedCategory: 'archive',
  });
  await waitFor(() => expect(screen.getByText('Move undone')).toBeTruthy());
});

it('keeps an unsuccessful Undo available for retry', async () => {
  undoMove
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce(true);
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(screen.getByText('Move undone')).toBeTruthy());
  expect(undoMove).toHaveBeenCalledTimes(2);
});

it('does not offer a stale Undo after the note moves again', async () => {
  undoMove.mockResolvedValue(false);
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await waitFor(() =>
    expect(
      screen.getByText(
        'This note has moved again. Undo is no longer available.',
      ),
    ).toBeTruthy(),
  );
  expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
});

it('replaces the previous notice when the same note is moved again', async () => {
  undoMove.mockResolvedValue(true);
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Trash' }));
  expect(screen.queryByText('Note archived')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(undoMove).toHaveBeenCalledWith({
    id: 'note1',
    previousCategory: 'archive',
    expectedCategory: 'trash',
  });
  await waitFor(() => expect(screen.getByText('Move undone')).toBeTruthy());
});

it('expires after ten seconds but pauses while the toast is hovered', () => {
  vi.useFakeTimers();
  setup();
  const toast = screen.getByText('Note archived').parentElement!;
  fireEvent.mouseEnter(toast);
  act(() => vi.advanceTimersByTime(15000));
  expect(screen.getByRole('button', { name: 'Undo' })).toBeTruthy();
  fireEvent.mouseLeave(toast);
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
});
