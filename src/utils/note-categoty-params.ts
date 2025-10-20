import { NoteCategory } from '@/types/note-category.ts';

export const isValidNoteCategory = (category: NoteCategory): boolean =>
  category === 'active' || category === 'archive' || category === 'trash';
