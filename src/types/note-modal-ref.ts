import { Note } from '@/types/note.ts';
import { TagWithStatus } from '@/types/tag.ts';

export type NoteModalRef = {
  note: Note | null;
  isDirty: boolean;
  tags: TagWithStatus[];
};
