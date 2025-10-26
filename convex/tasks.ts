import { GenericDataModel, GenericQueryCtx } from 'convex/server';
import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { noteSchema } from './schema.ts';

const getUserId = async <T extends GenericDataModel>(
  ctx: GenericQueryCtx<T>,
) => {
  const identity = await ctx.auth.getUserIdentity();

  if (identity === null) throw new Error('User not authenticated');
  return identity.subject;
};

export const fetchNotes = query({
  args: {
    category: v.union(
      v.literal('active'),
      v.literal('archive'),
      v.literal('trash'),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    return await ctx.db
      .query('notes')
      .withIndex('by_user_id_category_and_updated_at', (q) =>
        q.eq('userId', userId).eq('category', args.category),
      )
      .order('desc')
      .collect();
  },
});

export const fetchNote = query({
  args: { id: v.id('notes') },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    const userId = await getUserId(ctx);

    if (note === null || note.userId !== userId)
      throw new Error('Requested note does not belong to the user');
    return note;
  },
});

export const saveNote = mutation({
  args: { ...noteSchema },
  handler: async (ctx, args) =>
    await ctx.db.insert('notes', { ...args, userId: await getUserId(ctx) }),
});

export const updateNote = mutation({
  args: { ...noteSchema, id: v.id('notes') },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    if (userId !== args.userId)
      throw new Error('User not authorized to update this note');

    await ctx.db.replace(args.id, {
      userId: args.userId,
      title: args.title,
      content: args.content,
      category: args.category,
      updatedAt: args.updatedAt,
    });
  },
});

export const deleteNote = mutation({
  args: { id: v.id('notes') },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);
    const userId = await getUserId(ctx);

    if (note === null || note.userId !== userId)
      throw new Error('Note does not belong to the user');

    await ctx.db.delete(args.id);
  },
});
