import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';

export const createEditorExtensions = (placeholder = '') => [
  StarterKit.configure({
    underline: false,
    link: { openOnClick: false, HTMLAttributes: { target: null, rel: null } },
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
    // The live checkbox node view does not inherit renderHTML's data-type.
    // Keep its task-item styles identical to the serialized editor markup.
    HTMLAttributes: { 'data-type': 'taskItem' },
  }),
  TableKit,
  Placeholder.configure({ placeholder }),
  Markdown.configure({ markedOptions: { gfm: true, breaks: true } }),
];
