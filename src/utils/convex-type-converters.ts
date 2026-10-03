import { Note } from '@/types/note.ts';
import { Tag } from '@/types/tag.ts';

import { Doc } from '../../convex/_generated/dataModel';

export const docToNote = (doc: Doc<'notes'>): Note => ({
  id: doc._id,
  title: doc.title,
  content: doc.content,
  category: doc.category,
  createdAt: doc._creationTime,
  updatedAt: doc.updatedAt,
});

export const docToTag = (doc: Doc<'tags'>): Tag => ({
  id: doc._id,
  name: doc.name,
});
