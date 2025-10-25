import { v } from 'convex/values';

import { query } from './_generated/server';

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
