import { NoteCategory } from '@/types/note-category.ts';

export type Note = {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdAt: number;
  updatedAt: number;
};
