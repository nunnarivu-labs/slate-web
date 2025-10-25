import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const noteSchema = {
  category: v.union(
    v.literal('active'),
    v.literal('archive'),
    v.literal('trash'),
  ),
  content: v.string(),
  title: v.string(),
  updatedAt: v.float64(),
};

export default defineSchema({
  notes: defineTable(noteSchema).index('by_category_and_updated_at', [
    'category',
    'updatedAt',
  ]),
});
