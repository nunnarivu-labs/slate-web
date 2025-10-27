import { NoteCategory } from '@/types/note-category.ts';

export type Note = {
  readonly id: string;
  title: string;
  content: string;
  category: NoteCategory;
};
