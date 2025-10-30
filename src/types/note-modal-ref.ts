import { Note } from '@/types/note.ts';
import { TagWithUpdatedStatus } from '@/types/tag.ts';

export type NoteModalRef = {
  note: Note | null;
  isDirty: boolean;
  tags: TagWithUpdatedStatus[];
};
