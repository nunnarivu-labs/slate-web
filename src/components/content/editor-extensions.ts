import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';

export const createEditorExtensions = (placeholder = '') => [
  StarterKit.configure({
    underline: false,
    link: { openOnClick: false, HTMLAttributes: { target: null, rel: null } },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Placeholder.configure({ placeholder }),
  Markdown.configure({ markedOptions: { gfm: true, breaks: true } }),
];
