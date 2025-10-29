import { Note } from '@/types/note.ts';

import { Doc } from '../../convex/_generated/dataModel';

export const docToNote = (doc: Doc<'notes'>): Note => ({
  id: doc._id,
  title: doc.title,
  content: doc.content,
  category: doc.category,
  tags: [],
});
