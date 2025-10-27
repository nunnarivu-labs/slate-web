import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const draftNoteSchema = {
  category: v.union(
    v.literal('active'),
    v.literal('archive'),
    v.literal('trash'),
  ),
  content: v.string(),
  title: v.string(),
};

export const noteSchema = {
  ...draftNoteSchema,
  userId: v.id('users'),
  updatedAt: v.float64(),
};

export const tableSchema = { authProviderUserId: v.string() };

export default defineSchema({
  notes: defineTable(noteSchema).index('by_user_id_category_and_updated_at', [
    'userId',
    'category',
    'updatedAt',
  ]),
  users: defineTable(tableSchema).index('by_auth_provider_user_id', [
    'authProviderUserId',
  ]),
});
