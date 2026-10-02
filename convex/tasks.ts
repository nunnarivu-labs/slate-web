import { docToNote, docToTag } from '@/utils/convex-type-converters.ts';
import { normalizeSearchQuery } from '@/utils/search-query.ts';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

import { internal } from './_generated/api';
import { Id } from './_generated/dataModel';
import { internalMutation, mutation, query } from './_generated/server';
import { draftNoteSchema, tagsArg } from './schema.ts';
import { buildSearchText } from './searchText';
import {
  updateTags as doUpdateTags,
  getNote,
  getNoteTagsData,
  getUser,
} from './taskHelpers.ts';

export const fetchNotes = query({
  args: {
    category: v.union(
      v.literal('active'),
      v.literal('archive'),
      v.literal('trash'),
    ),
    tagIds: v.optional(v.array(v.id('tags'))),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);

    if (args.tagIds && args.tagIds.length > 0) {
      const tagNotes = await Promise.all(
        args.tagIds.map(
          async (tagId) =>
            await ctx.db
              .query('tagNote')
              .withIndex('by_tag_id', (q) => q.eq('tagId', tagId))
              .collect(),
        ),
      );
      const noteIds = Array.from(
        new Set<Id<'notes'>>(tagNotes.flatMap((tn) => tn.map((t) => t.noteId))),
      );

      const allNotes = await Promise.all(
        noteIds.map(async (noteId) => await ctx.db.get(noteId)),
      );
      const filteredNotes = allNotes.filter(
        (note) =>
          note && note.userId === user._id && note.category === args.category,
      ) as NonNullable<(typeof allNotes)[number]>[];

      filteredNotes.sort((a, b) => b.updatedAt - a.updatedAt);

      return filteredNotes.map(docToNote);
    }

    const notes = await ctx.db
      .query('notes')
      .withIndex('by_user_id_category_and_updated_at', (q) =>
        q.eq('userId', user._id).eq('category', args.category),
      )
      .order('desc')
      .collect();

    return notes.map(docToNote);
  },
});

// Run tasks:backfillSearchText with {} from the dashboard once. Each batch
// schedules the next; rerunning safely skips notes that are already indexed.
export const backfillSearchText = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    scanned: v.optional(v.number()),
    indexed: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ complete: boolean; scanned: number; indexed: number }> => {
    const batch = await ctx.db.query('notes').paginate({
      cursor: args.cursor ?? null,
      numItems: 100,
      maximumBytesRead: 2_000_000,
    });
    const missing = batch.page.filter((note) => note.searchText === undefined);
    await Promise.all(
      missing.map((note) =>
        ctx.db.patch(note._id, {
          searchText: buildSearchText(note.title, note.content),
        }),
      ),
    );
    const scanned = (args.scanned ?? 0) + batch.page.length;
    const indexed = (args.indexed ?? 0) + missing.length;
    if (!batch.isDone) {
      await ctx.scheduler.runAfter(0, internal.tasks.backfillSearchText, {
        cursor: batch.continueCursor,
        scanned,
        indexed,
      });
    }
    console.info(
      `Search backfill ${batch.isDone ? 'complete' : 'in progress'}: ${scanned} notes scanned, ${indexed} indexed.`,
    );
    return { complete: batch.isDone, scanned, indexed };
  },
});

export const searchNotes = query({
  args: {
    query: v.string(),
    category: v.union(
      v.literal('active'),
      v.literal('archive'),
      v.literal('trash'),
    ),
    tagIds: v.optional(v.array(v.id('tags'))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const queryText = normalizeSearchQuery(args.query);
    if (!queryText) return { page: [], isDone: true, continueCursor: '' };
    const matches = await ctx.db
      .query('notes')
      .withSearchIndex('search_notes', (q) =>
        q
          .search('searchText', queryText)
          .eq('userId', user._id)
          .eq('category', args.category),
      )
      .paginate(args.paginationOpts);
    const selectedTags = new Set(args.tagIds ?? []);
    // Preserve the existing tag filter's "any selected tag" behavior. Filtering
    // each page preserves relevance and the continuation cursor for later matches.
    const page = selectedTags.size
      ? (
          await Promise.all(
            matches.page.map(async (note) => {
              const tags = await getNoteTagsData(ctx, note._id);
              return tags.some((tag) => selectedTags.has(tag.tagId))
                ? docToNote(note)
                : null;
            }),
          )
        ).filter((note) => note !== null)
      : matches.page.map(docToNote);
    return { ...matches, page };
  },
});

export const fetchNote = query({
  args: { id: v.id('notes') },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);

    const note = await getNote(ctx, { noteId: args.id, userId: user._id });

    if (note === null || note.userId !== user._id)
      throw new Error('Requested note does not belong to the user');

    return docToNote(note);
  },
});

export const saveNote = mutation({
  args: { note: v.object({ ...draftNoteSchema }), tags: tagsArg },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);

    const noteId = await ctx.db.insert('notes', {
      ...args.note,
      searchText: buildSearchText(args.note.title, args.note.content),
      userId: user._id,
      updatedAt: Date.now(),
    });

    await doUpdateTags(ctx, { tags: args.tags, noteId, user });

    return noteId;
  },
});

export const updateNote = mutation({
  args: {
    note: v.object({ ...draftNoteSchema }),
    id: v.id('notes'),
    tags: tagsArg,
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const note = await getNote(ctx, { noteId: args.id, userId: user._id });

    if (user._id !== note.userId)
      throw new Error('Note does not belong to the user');

    await ctx.db.replace(args.id, {
      ...args.note,
      searchText: buildSearchText(args.note.title, args.note.content),
      userId: user._id,
      updatedAt: Date.now(),
    });

    await doUpdateTags(ctx, { tags: args.tags, noteId: args.id, user });
  },
});

// Card quick actions change only the category, preserving concurrent edits.
export const moveNote = mutation({
  args: {
    id: v.id('notes'),
    category: v.union(
      v.literal('active'),
      v.literal('archive'),
      v.literal('trash'),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const note = await getNote(ctx, { noteId: args.id, userId: user._id });
    if (note.category !== args.category) {
      await ctx.db.patch(args.id, {
        category: args.category,
        updatedAt: Date.now(),
      });
    }
    return note.category;
  },
});

// Restore only the category so Undo never rolls back content or tag edits.
export const undoNoteMove = mutation({
  args: {
    id: v.id('notes'),
    previousCategory: v.union(
      v.literal('active'),
      v.literal('archive'),
      v.literal('trash'),
    ),
    expectedCategory: v.union(v.literal('archive'), v.literal('trash')),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const note = await getNote(ctx, { noteId: args.id, userId: user._id });
    if (note.category === args.previousCategory) return true;
    // A later move from another tab/device takes precedence over an old Undo.
    if (note.category !== args.expectedCategory) return false;
    await ctx.db.patch(args.id, {
      category: args.previousCategory,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const deleteNote = mutation({
  args: { id: v.id('notes') },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const note = await getNote(ctx, { noteId: args.id, userId: user._id });

    if (user._id !== note.userId)
      throw new Error('Note does not belong to the user');

    const tags = await getNoteTagsData(ctx, note._id);

    await Promise.all(tags.map(async (tag) => await ctx.db.delete(tag._id)));
    await ctx.db.delete(args.id);
  },
});

export const fetchAllTags = query({
  handler: async (ctx) => {
    const user = await getUser(ctx);

    const tags = await ctx.db
      .query('tags')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .collect();

    return tags.map(docToTag);
  },
});

export const fetchNoteTags = query({
  args: { noteId: v.id('notes') },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);

    const tagNotes = await getNoteTagsData(ctx, args.noteId);

    const allTags = await Promise.all(
      tagNotes.map(async (tagNote) => await ctx.db.get(tagNote.tagId)),
    );

    return allTags
      .filter((tag) => !!tag && tag.userId === user._id)
      .map((tag) => docToTag(tag!));
  },
});

export const updateTags = mutation({
  args: { tags: tagsArg, noteId: v.id('notes') },
  handler: async (ctx, args) =>
    await doUpdateTags(ctx, { tags: args.tags, noteId: args.noteId }),
});

export const editTagName = mutation({
  args: { id: v.id('tags'), newName: v.string() },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const tag = await ctx.db.get(args.id);

    if (tag && tag.userId === user._id) {
      await ctx.db.patch(args.id, { name: args.newName });
    }
  },
});

export const deleteTag = mutation({
  args: { id: v.id('tags') },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const tag = await ctx.db.get(args.id);

    if (!tag) return;

    if (tag.userId === user._id) {
      const tagNotes = await ctx.db
        .query('tagNote')
        .withIndex('by_tag_id', (q) => q.eq('tagId', args.id))
        .collect();

      await Promise.all(
        tagNotes.map(async (tagNote) => await ctx.db.delete(tagNote._id)),
      );

      await ctx.db.delete(args.id);
    }
  },
});

export const deleteAllMessages = internalMutation({
  handler: async (ctx) => {
    const deletedNotes = await ctx.db
      .query('notes')
      .withIndex('by_category_and_updated_at', (q) =>
        q
          .eq('category', 'trash')
          .lte('updatedAt', Date.now() - 24 * 60 * 60 * 1000),
      )
      .collect();

    const noteIds = deletedNotes.map((note) => note._id);

    await Promise.all(
      noteIds.map(async (noteId) => {
        const noteTags = await getNoteTagsData(ctx, noteId);
        await Promise.all(
          noteTags.map(async (noteTag) => await ctx.db.delete(noteTag._id)),
        );
      }),
    );

    await Promise.all(noteIds.map(async (id) => await ctx.db.delete(id)));
  },
});
