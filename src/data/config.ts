import { Note } from '@/types/note.ts';
import fs from 'node:fs';

const FILE_PATH = 'temp-data/notes-3.json';

export const readNotes = async (): Promise<Note[]> =>
  JSON.parse(await fs.promises.readFile(FILE_PATH, 'utf-8'));

export const writeNotes = async (notes: Note[]) =>
  await fs.promises.writeFile(FILE_PATH, JSON.stringify(notes), 'utf-8');

export const LOCAL_STORAGE_USER_KEY = 'slate.user';
