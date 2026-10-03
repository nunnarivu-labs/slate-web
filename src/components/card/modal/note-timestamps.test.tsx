import { docToNote } from '@/utils/convex-type-converters';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { Doc } from '../../../../convex/_generated/dataModel';
import { NoteTimestamps } from './note-timestamps';

const now = new Date('2026-10-03T01:30:00Z').getTime();
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('shows the saved update time and exact creation and update times on hover', () => {
  const createdAt = now - 86_400_000;
  const updatedAt = now - 7_200_000;
  render(<NoteTimestamps createdAt={createdAt} updatedAt={updatedAt} />);
  const label = screen.getByText('Updated 2 hours ago');
  expect(label.getAttribute('datetime')).toBe(
    new Date(updatedAt).toISOString(),
  );
  const format = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
  expect(label.getAttribute('title')).toBe(
    `Created: ${format.format(createdAt)}\nLast updated: ${format.format(updatedAt)}`,
  );
});

it('hides timestamps for unsaved notes', () => {
  const { container } = render(<NoteTimestamps />);
  expect(container.querySelector('time')).toBeNull();
});

it('keeps the relative time fresh while the modal remains open', () => {
  render(<NoteTimestamps createdAt={now} updatedAt={now} />);
  expect(screen.getByText('Updated just now')).toBeTruthy();
  act(() => vi.advanceTimersByTime(60_000));
  expect(screen.getByText('Updated 1 minute ago')).toBeTruthy();
});

it('passes persisted database timestamps through to the note', () => {
  const note = docToNote({
    _id: 'saved',
    _creationTime: now - 86_400_000,
    userId: 'user',
    title: 'Example',
    content: 'Body',
    category: 'active',
    updatedAt: now,
  } as Doc<'notes'>);
  expect(note.createdAt).toBe(now - 86_400_000);
  expect(note.updatedAt).toBe(now);
});
