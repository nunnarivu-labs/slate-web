import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { closeHistory } from '@tiptap/pm/history';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  CheckSquare,
  Code,
  Heading2,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Undo2,
} from 'lucide-react';
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RefObject } from 'react';

import { createEditorExtensions } from './editor-extensions';
import { TableControls } from './table-controls';

export type ContentEditorRef = {
  focusEnd: () => void;
  getMarkdown: () => string;
  appendMarkdown: (markdown: string) => void;
};

type ContentEditorProps = {
  ref?: RefObject<ContentEditorRef | null>;
  content: string;
  onChange: (md: string) => void;
  autofocusEnd?: boolean;
  placeholder?: string;
};

function FormattingToolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useKeyboardShortcut(
    'Escape',
    () => {
      setLinkOpen(false);
      editor.commands.focus();
    },
    { scope: 'overlay', enabled: linkOpen, allowTyping: true, priority: 40 },
  );

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      strike: current.isActive('strike'),
      heading: current.isActive('heading', { level: 2 }),
      bullet: current.isActive('bulletList'),
      ordered: current.isActive('orderedList'),
      task: current.isActive('taskList'),
      quote: current.isActive('blockquote'),
      code: current.isActive('code'),
      codeBlock: current.isActive('codeBlock'),
      link: current.isActive('link'),
      undo: current.can().undo(),
      redo: current.can().redo(),
    }),
  });

  const actions = useMemo(
    () => [
      {
        label: 'Bold',
        icon: Bold,
        active: state.bold,
        run: () => editor.chain().focus().toggleBold().run(),
      },
      {
        label: 'Italic',
        icon: Italic,
        active: state.italic,
        run: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        label: 'Strikethrough',
        icon: Strikethrough,
        active: state.strike,
        run: () => editor.chain().focus().toggleStrike().run(),
      },
      {
        label: 'Heading',
        icon: Heading2,
        active: state.heading,
        run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        label: 'Bullet list',
        icon: List,
        active: state.bullet,
        run: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        label: 'Numbered list',
        icon: ListOrdered,
        active: state.ordered,
        run: () => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        label: 'Checklist',
        icon: CheckSquare,
        active: state.task,
        run: () => editor.chain().focus().toggleTaskList().run(),
      },
      {
        label: 'Quote',
        icon: Quote,
        active: state.quote,
        run: () => editor.chain().focus().toggleBlockquote().run(),
      },
      {
        label: 'Inline code',
        icon: Code,
        active: state.code,
        run: () => editor.chain().focus().toggleCode().run(),
      },
      {
        label: 'Code block',
        icon: SquareCode,
        active: state.codeBlock,
        run: () => editor.chain().focus().toggleCodeBlock().run(),
      },
      {
        label: 'Link',
        icon: Link,
        active: state.link,
        run: () => {
          setUrl(editor.getAttributes('link').href ?? '');
          setError('');
          setLinkOpen(!linkOpen);
        },
      },
      {
        label: 'Undo',
        icon: Undo2,
        disabled: !state.undo,
        run: () => editor.chain().focus().undo().run(),
      },
      {
        label: 'Redo',
        icon: Redo2,
        disabled: !state.redo,
        run: () => editor.chain().focus().redo().run(),
      },
    ],
    [editor, state, linkOpen],
  );

  return (
    <div className="mb-3 shrink-0 border-b border-zinc-200 pb-2 dark:border-zinc-700">
      <div
        role="group"
        aria-label="Text formatting"
        className="flex flex-wrap gap-1"
      >
        {actions.map(({ label, icon: Icon, active, disabled, run }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={run}
            className={`rounded p-2 text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-700 ${active ? 'bg-zinc-200 dark:bg-zinc-600' : ''}`}
          >
            <Icon size={16} />
          </button>
        ))}
        <TableControls editor={editor} />
      </div>
      {linkOpen && (
        <form
          data-shortcut-overlay
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const href = url.trim();
            if (href && !/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
              setError('Use an https://, http://, mailto:, or tel: link.');
              return;
            }
            const chain = editor.chain().focus().extendMarkRange('link');
            if (href) chain.setLink({ href }).run();
            else chain.unsetLink().run();
            setLinkOpen(false);
          }}
        >
          <input
            autoFocus
            aria-label="Link URL"
            inputMode="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setError('');
            }}
            placeholder="https://example.com"
            className="min-w-0 flex-1 rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-600"
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              setLinkOpen(false);
            }}
            className="rounded px-2 py-1 text-sm"
          >
            Remove
          </button>
          {error && (
            <p role="alert" className="w-full text-sm text-red-500">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export const ContentEditor = ({
  ref,
  content,
  onChange,
  autofocusEnd = false,
  placeholder = '',
}: ContentEditorProps) => {
  // Keep untouched Markdown verbatim; serialize only actual document edits.
  const published = useRef(content);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: createEditorExtensions(placeholder),
    content,
    contentType: 'markdown',
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Note content',
        'aria-multiline': 'true',
        class:
          'note-content tiptap prose dark:prose-invert min-h-full outline-none',
      },
    },
    onCreate: ({ editor: current }) => {
      if (autofocusEnd) current.commands.focus('end');
    },
    onUpdate: ({ editor: current }) => {
      // Empty tables still have structure worth saving. The Markdown serializer
      // already normalizes an actually empty document to an empty string.
      const markdown = current.getMarkdown();
      published.current = markdown;
      onChangeRef.current(markdown);
    },
  });

  useEffect(() => {
    if (!editor || content === published.current) return;
    editor.commands.setContent(content, {
      contentType: 'markdown',
      emitUpdate: false,
    });
    published.current = content;
  }, [content, editor]);

  useImperativeHandle(
    ref,
    () => ({
      focusEnd: () => {
        editor?.commands.focus('end');
      },
      getMarkdown: () => published.current,
      appendMarkdown: (markdown) => {
        if (!editor) return;
        editor
          .chain()
          .focus('end')
          .command(({ tr }) => {
            closeHistory(tr);
            return true;
          })
          .insertContentAt(editor.state.doc.content.size, markdown, {
            contentType: 'markdown',
          })
          .run();
        editor.view.dispatch(closeHistory(editor.state.tr));
      },
    }),
    [editor],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col text-zinc-800 dark:text-zinc-200">
      {editor && <FormattingToolbar editor={editor} />}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="min-h-full" />
      </div>
    </div>
  );
};
