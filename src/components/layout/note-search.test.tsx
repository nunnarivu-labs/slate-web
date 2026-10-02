import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { NoteSearch } from './note-search';

const router = vi.hoisted(() => ({
  navigate: vi.fn(),
  search: { q: undefined as string | undefined, tags: ['tag1'] },
  category: 'active',
}));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => router.navigate,
  useParams: () => ({ category: router.category }),
  useSearch: () => router.search,
}));
beforeEach(() => {
  router.navigate.mockReset();
  router.search = { q: undefined, tags: ['tag1'] };
  router.category = 'active';
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('debounces typing and preserves the category and tag filters in the URL', () => {
  render(<NoteSearch />);
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'rome' },
  });
  act(() => vi.advanceTimersByTime(200));
  expect(router.navigate).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'rome trip' },
  });
  act(() => vi.advanceTimersByTime(250));
  expect(router.navigate).toHaveBeenCalledOnce();
  expect(router.navigate).toHaveBeenCalledWith({
    to: '/notes/$category',
    params: { category: 'active' },
    search: { q: 'rome trip', tags: ['tag1'] },
    replace: true,
    resetScroll: true,
  });
});

it('clears an existing search immediately without losing the tags', () => {
  router.search.q = 'rome';
  render(<NoteSearch />);
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('');
  expect(router.navigate.mock.calls[0][0].search).toEqual({
    q: undefined,
    tags: ['tag1'],
  });
});

it('restores URL changes and cancels an outstanding debounce on navigation', () => {
  const view = render(<NoteSearch />);
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'unfinished' },
  });
  router.search = { q: 'existing search', tags: ['tag1'] };
  router.category = 'archive';
  view.rerender(<NoteSearch />);
  act(() => vi.advanceTimersByTime(300));
  expect(router.navigate).not.toHaveBeenCalled();
  expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe(
    'existing search',
  );
});

it('submits immediately and cancels duplicate delayed requests', () => {
  render(<NoteSearch />);
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'project' },
  });
  fireEvent.submit(screen.getByRole('search'));
  act(() => vi.advanceTimersByTime(300));
  expect(router.navigate).toHaveBeenCalledOnce();
});
