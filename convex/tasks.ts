import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { noteSchema } from './schema.ts';

export const fetchNotes = query({
  args: {
    userId: v.string(),
    category: v.union(
      v.literal('active'),
      v.literal('archive'),
      v.literal('trash'),
    ),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query('notes')
      .withIndex('by_user_id_category_and_updated_at', (q) =>
        q.eq('userId', args.userId).eq('category', args.category),
      )
      .order('desc')
      .collect(),
});

export const fetchNote = query({
  args: { id: v.id('notes'), userId: v.string() },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id);

    if (note === null || note.userId !== args.userId)
      throw new Error('Requested note does not belong to the user');
    return note;
  },
});

export const saveNote = mutation({
  args: { ...noteSchema },
  handler: async (ctx, args) => await ctx.db.insert('notes', args),
});

export const updateNote = mutation({
  args: { ...noteSchema, id: v.id('notes') },
  handler: async (ctx, args) =>
    await ctx.db.replace(args.id, {
      userId: args.userId,
      title: args.title,
      content: args.content,
      category: args.category,
      updatedAt: args.updatedAt,
    }),
});

export const deleteNote = mutation({
  args: { id: v.id('notes') },
  handler: async (ctx, args) => await ctx.db.delete(args.id),
});
