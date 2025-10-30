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

export const userSchema = { authProviderUserId: v.string() };

export const tagSchema = { name: v.string(), userId: v.id('users') };
export const tagNoteSchema = { tagId: v.id('tags'), noteId: v.id('notes') };

export const tagsArg = v.array(
  v.object({
    id: v.string(),
    name: v.string(),
    status: v.union(
      v.literal('NEWLY_ADDED'),
      v.literal('REMOVED'),
      v.literal('NEWLY_CREATED'),
      v.literal('ALREADY_ADDED'),
    ),
  }),
);

export default defineSchema({
  notes: defineTable(noteSchema).index('by_user_id_category_and_updated_at', [
    'userId',
    'category',
    'updatedAt',
  ]),

  users: defineTable(userSchema).index('by_auth_provider_user_id', [
    'authProviderUserId',
  ]),

  tags: defineTable(tagSchema).index('by_user_id', ['userId']),

  tagNote: defineTable(tagNoteSchema)
    .index('by_tag_id', ['tagId'])
    .index('by_note_id', ['noteId']),
});
