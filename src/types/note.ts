import { NoteCategory } from '@/types/note-category.ts';

export type Tag = {
  id: string;
  name: string;
};

export type Note = {
  readonly id: string;
  title: string;
  content: string;
  category: NoteCategory;
  tags: Tag[];
};
