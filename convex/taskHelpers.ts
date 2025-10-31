import { TagWithStatus } from '@/types/tag.ts';

import { Doc, Id } from './_generated/dataModel';
import { MutationCtx, QueryCtx } from './_generated/server';

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

export const getNote = async (
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

export const getNoteTagsData = async (
  ctx: QueryCtx | MutationCtx,
  noteId: Id<'notes'>,
) =>
  await ctx.db
    .query('tagNote')
    .withIndex('by_note_id', (q) => q.eq('noteId', noteId))
    .collect();

export const updateTags = async (
  ctx: MutationCtx,
  args: { tags: TagWithStatus[]; noteId: Id<'notes'>; user?: Doc<'users'> },
) => {
  const user = args.user ?? (await getUser(ctx));

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
            .withIndex('by_tag_id', (q) => q.eq('tagId', tag.id as Id<'tags'>))
            .first();

          if (tagNote) await ctx.db.delete(tagNote._id);
        }
      }),
  );
};
