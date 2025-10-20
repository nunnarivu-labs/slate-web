export type NoteCategory = 'active' | 'archive' | 'trash';

export const isValidNoteCategory = (category: NoteCategory): boolean =>
  category === 'active' || category === 'archive' || category === 'trash';
