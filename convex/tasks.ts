import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { noteSchema } from './schema.ts';

export const fetchNotes = query({
  args: {
    category: v.union(
      v.literal('active'),
      v.literal('archive'),
      v.literal('trash'),
    ),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query('notes')
      .withIndex('by_category_and_updated_at', (q) =>
        q.eq('category', args.category),
      )
      .order('desc')
      .collect(),
});

export const fetchNote = query({
  args: { id: v.id('notes') },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const saveNote = mutation({
  args: { ...noteSchema },
  handler: async (ctx, args) => await ctx.db.insert('notes', args),
});

export const updateNote = mutation({
  args: { ...noteSchema, id: v.id('notes') },
  handler: async (ctx, args) =>
    await ctx.db.replace(args.id, {
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
