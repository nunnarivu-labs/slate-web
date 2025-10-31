import { docToNote, docToTag } from '@/utils/convex-type-converters.ts';
import { v } from 'convex/values';

import { internalMutation, mutation, query } from './_generated/server';
import { draftNoteSchema, tagsArg } from './schema.ts';
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
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);

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
      userId: user._id,
      updatedAt: Date.now(),
    });

    await doUpdateTags(ctx, { tags: args.tags, noteId: args.id, user });
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
