import { docToNote, docToTag } from '@/utils/convex-type-converters.ts';
import { v } from 'convex/values';

import { Id } from './_generated/dataModel';
import { MutationCtx, QueryCtx, mutation, query } from './_generated/server';
import { draftNoteSchema, tagsArg } from './schema.ts';

export const getUser = async (ctx: MutationCtx | QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) throw new Error('User is not authenticated');

  const user = await ctx.db
    .query('users')
    .withIndex('by_auth_provider_user_id', (q) =>
      q.eq('authProviderUserId', identity.subject),
    )
    .unique();

  if (!user) throw new Error('User not found');

  return user;
};

const getNote = async (
  ctx: QueryCtx | MutationCtx,
  args: {
    noteId: Id<'notes'>;
    userId: Id<'users'>;
  },
) => {
  const note = await ctx.db.get(args.noteId);

  if (note === null || note.userId !== args.userId)
    throw new Error('Requested note does not belong to the user');

  return note;
};

const getNoteTagsData = async (
  ctx: QueryCtx | MutationCtx,
  noteId: Id<'notes'>,
) =>
  await ctx.db
    .query('tagNote')
    .withIndex('by_note_id', (q) => q.eq('noteId', noteId))
    .collect();

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

    await Promise.all(
      args.tags
        .filter((tag) => tag.status !== 'ALREADY_ADDED')
        .map(async (tag) => {
          if (tag.status === 'NEWLY_CREATED') {
            const tagId = await ctx.db.insert('tags', {
              name: tag.name,
              userId: user._id,
            });

            await ctx.db.insert('tagNote', { noteId, tagId });
          } else if (tag.status === 'NEWLY_ADDED') {
            await ctx.db.insert('tagNote', {
              noteId,
              tagId: tag.id as Id<'tags'>,
            });
          } else if (tag.status === 'REMOVED') {
            const tagNote = await ctx.db
              .query('tagNote')
              .withIndex('by_tag_id', (q) =>
                q.eq('tagId', tag.id as Id<'tags'>),
              )
              .first();

            if (tagNote) await ctx.db.delete(tagNote._id);
          }
        }),
    );

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

    await Promise.all(
      args.tags
        .filter((tag) => tag.status !== 'ALREADY_ADDED')
        .map(async (tag) => {
          if (tag.status === 'NEWLY_CREATED') {
            const tagId = await ctx.db.insert('tags', {
              name: tag.name,
              userId: user._id,
            });

            await ctx.db.insert('tagNote', { noteId: args.id, tagId });
          } else if (tag.status === 'NEWLY_ADDED') {
            await ctx.db.insert('tagNote', {
              noteId: args.id,
              tagId: tag.id as Id<'tags'>,
            });
          } else if (tag.status === 'REMOVED') {
            const tagNote = await ctx.db
              .query('tagNote')
              .withIndex('by_tag_id', (q) =>
                q.eq('tagId', tag.id as Id<'tags'>),
              )
              .first();

            if (tagNote) await ctx.db.delete(tagNote._id);
          }
        }),
    );
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
  handler: async (ctx, args) => {
    const user = await getUser(ctx);

    await Promise.all(
      args.tags
        .filter((tag) => tag.status !== 'ALREADY_ADDED')
        .map(async (tag) => {
          if (tag.status === 'NEWLY_CREATED') {
            const tagId = await ctx.db.insert('tags', {
              name: tag.name,
              userId: user._id,
            });

            await ctx.db.insert('tagNote', { noteId: args.noteId, tagId });
          } else if (tag.status === 'NEWLY_ADDED') {
            await ctx.db.insert('tagNote', {
              noteId: args.noteId,
              tagId: tag.id as Id<'tags'>,
            });
          } else if (tag.status === 'REMOVED') {
            const tagNote = await ctx.db
              .query('tagNote')
              .withIndex('by_tag_id', (q) =>
                q.eq('tagId', tag.id as Id<'tags'>),
              )
              .first();

            if (tagNote) await ctx.db.delete(tagNote._id);
          }
        }),
    );
  },
});
