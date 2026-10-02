import { normalizeSearchQuery } from '@/utils/search-query.ts';
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from 'convex/server';
import { beforeEach, expect, it, vi } from 'vitest';

import type { api, internal } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../../convex/_generated/server';
import { buildSearchText } from '../../convex/searchText';
import {
  backfillSearchText,
  saveNote,
  searchNotes,
  updateNote,
} from '../../convex/tasks';

// Registered functions expose their handler at runtime for direct unit tests.
function handler<
  Ref extends FunctionReference<'query' | 'mutation', 'public' | 'internal'>,
>(registered: unknown) {
  return (
    registered as {
      _handler: (
        ctx: QueryCtx | MutationCtx,
        args: FunctionArgs<Ref>,
      ) => Promise<FunctionReturnType<Ref>>;
    }
  )._handler;
}
const runSearch = handler<typeof api.tasks.searchNotes>(searchNotes);
const runBackfill =
  handler<typeof internal.tasks.backfillSearchText>(backfillSearchText);
const runSave = handler<typeof api.tasks.saveNote>(saveNote);
const runUpdate = handler<typeof api.tasks.updateNote>(updateNote);

const helpers = vi.hoisted(() => ({
  getUser: vi.fn(),
  getNote: vi.fn(),
  getNoteTagsData: vi.fn(),
  updateTags: vi.fn(),
}));
vi.mock('../../convex/taskHelpers.ts', () => helpers);
beforeEach(() => {
  vi.clearAllMocks();
  helpers.getUser.mockResolvedValue({ _id: 'user1' });
});

const note = (id: string, searchText?: string): Doc<'notes'> => ({
  _id: id as Id<'notes'>,
  _creationTime: 1,
  title: 'Rome',
  content: '**Travel** plans',
  category: 'active',
  userId: 'user1' as Id<'users'>,
  updatedAt: 1,
  ...(searchText === undefined ? {} : { searchText }),
});

it('indexes the title, readable prose, checklist text and code without link URLs', () => {
  const result = buildSearchText(
    'Trip',
    '## Rome\n- [ ] **Book** [hotel](https://private.example/secret)\n\n```js\nconst city = "Rome"\n```',
  );
  expect(result).toContain('Trip');
  expect(result).toContain('Rome Book hotel');
  expect(result).toContain('const city = "Rome"');
  expect(result).not.toContain('private.example');
  expect(result).not.toContain('```');
});

it('normalizes punctuation and limits the query to the supported number of terms', () => {
  expect(normalizeSearchQuery('  Rome, day-1! ')).toBe('Rome day 1');
  expect(normalizeSearchQuery('***')).toBe('');
  expect(
    normalizeSearchQuery(
      Array.from({ length: 20 }, (_, i) => `word${i}`).join(' '),
    ).split(' '),
  ).toHaveLength(16);
});

it('applies the authenticated user and category filters before returning tagged results', async () => {
  const builder = { search: vi.fn(), eq: vi.fn() };
  builder.search.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  const paginate = vi.fn().mockResolvedValue({
    page: [note('note1'), note('note2')],
    isDone: false,
    continueCursor: 'next-page',
  });
  const withSearchIndex = vi.fn((_name, filter) => {
    filter(builder);
    return { paginate };
  });
  const ctx = {
    db: { query: vi.fn(() => ({ withSearchIndex })) },
  } as unknown as QueryCtx;
  helpers.getNoteTagsData.mockImplementation(async (_ctx, id) => [
    { tagId: id === 'note2' ? 'selected-tag' : 'other-tag' },
  ]);
  const result = await runSearch(ctx, {
    query: 'Rome',
    category: 'archive',
    tagIds: ['selected-tag' as Id<'tags'>],
    paginationOpts: { cursor: null, numItems: 24 },
  });
  expect(builder.eq).toHaveBeenCalledWith('userId', 'user1');
  expect(builder.eq).toHaveBeenCalledWith('category', 'archive');
  expect(result.page.map((item) => item.id)).toEqual(['note2']);
  expect(result.continueCursor).toBe('next-page');
  expect(result.isDone).toBe(false);
});

it('avoids querying the index for an empty search', async () => {
  const query = vi.fn();
  const result = await runSearch({ db: { query } } as unknown as QueryCtx, {
    query: '***',
    category: 'active',
    paginationOpts: { cursor: null, numItems: 24 },
  });
  expect(result.page).toEqual([]);
  expect(query).not.toHaveBeenCalled();
});

it('backfills all users in bounded batches, preserves existing text, and schedules continuation', async () => {
  const otherUserNote = {
    ...note('missing'),
    userId: 'another-user' as Id<'users'>,
  };
  const paginate = vi.fn().mockResolvedValue({
    page: [otherUserNote, note('indexed', 'Already indexed')],
    isDone: false,
    continueCursor: 'next',
  });
  const patch = vi.fn();
  const runAfter = vi.fn();
  const ctx = {
    db: { query: vi.fn(() => ({ paginate })), patch },
    scheduler: { runAfter },
  } as unknown as MutationCtx;
  const result = await runBackfill(ctx, {});
  expect(helpers.getUser).not.toHaveBeenCalled();
  expect(patch).toHaveBeenCalledOnce();
  expect(patch).toHaveBeenCalledWith('missing', {
    searchText: 'Rome\nTravel plans',
  });
  expect(runAfter.mock.calls[0][0]).toBe(0);
  expect(runAfter.mock.calls[0][2]).toEqual({
    cursor: 'next',
    scanned: 2,
    indexed: 1,
  });
  expect(result).toEqual({ complete: false, scanned: 2, indexed: 1 });
});

it('finishes the migration without scheduling another batch and is safe to rerun', async () => {
  const paginate = vi.fn().mockResolvedValue({
    page: [note('indexed', 'Already indexed')],
    isDone: true,
    continueCursor: 'done',
  });
  const patch = vi.fn();
  const runAfter = vi.fn();
  const ctx = {
    db: { query: vi.fn(() => ({ paginate })), patch },
    scheduler: { runAfter },
  } as unknown as MutationCtx;
  const result = await runBackfill(ctx, {
    cursor: 'previous',
    scanned: 100,
    indexed: 100,
  });
  expect(patch).not.toHaveBeenCalled();
  expect(runAfter).not.toHaveBeenCalled();
  expect(result).toEqual({ complete: true, scanned: 101, indexed: 100 });
});

it('updates the searchable text when a note is created or edited', async () => {
  const insert = vi.fn().mockResolvedValue('new-note');
  const replace = vi.fn();
  helpers.getNote.mockResolvedValue(note('existing'));
  const ctx = { db: { insert, replace } } as unknown as MutationCtx;
  await runSave(ctx, {
    note: {
      title: 'New title',
      content: '**New content**',
      category: 'active',
    },
    tags: [],
  });
  expect(insert.mock.calls[0][1].searchText).toBe('New title\nNew content');
  await runUpdate(ctx, {
    id: 'existing' as Id<'notes'>,
    note: {
      title: 'Edited title',
      content: '**Edited content**',
      category: 'active',
    },
    tags: [],
  });
  expect(replace.mock.calls[0][1].searchText).toBe(
    'Edited title\nEdited content',
  );
});
