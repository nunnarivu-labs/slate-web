import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { Table2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function TableControls({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inTable = useEditorState({
    editor,
    selector: ({ editor: current }) => current.isActive('table'),
  });
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', dismiss);
    return () => document.removeEventListener('mousedown', dismiss);
  }, [open]);
  useKeyboardShortcut('Escape', close, {
    scope: 'overlay',
    enabled: open,
    allowTyping: true,
    priority: 40,
  });

  const actions = inTable
    ? [
        {
          label: 'Add row below',
          run: () => editor.chain().focus().addRowAfter().run(),
        },
        {
          label: 'Add column after',
          run: () => editor.chain().focus().addColumnAfter().run(),
        },
        {
          label: 'Delete row',
          run: () =>
            editor
              .chain()
              .focus()
              .deleteRow()
              .command(({ tr, commands }) => {
                // Markdown tables require a header. Promote the next row when the
                // header is removed, so saving doesn't introduce an extra row.
                const { $from } = tr.selection;
                for (let depth = $from.depth; depth > 0; depth--) {
                  const node = $from.node(depth);
                  if (node.type.name === 'table') {
                    if (
                      node.firstChild?.firstChild?.type.name !== 'tableHeader'
                    )
                      commands.toggleHeaderRow();
                    break;
                  }
                }
                return true;
              })
              .run(),
        },
        {
          label: 'Delete column',
          run: () => editor.chain().focus().deleteColumn().run(),
        },
        {
          label: 'Delete table',
          run: () => editor.chain().focus().deleteTable().run(),
        },
      ]
    : [
        {
          label: 'Insert table',
          run: () =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run(),
        },
      ];

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        title="Table"
        aria-label="Table"
        aria-expanded={open}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen(!open)}
        className={`rounded p-2 text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-700 ${inTable ? 'bg-zinc-200 dark:bg-zinc-600' : ''}`}
      >
        <Table2 size={16} />
      </button>
      {open && (
        <div
          data-shortcut-overlay
          role="group"
          aria-label="Table actions"
          className="absolute top-full right-0 z-10 mt-1 w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-700"
        >
          {actions.map(({ label, run }) => (
            <button
              key={label}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                run();
                setOpen(false);
              }}
              className="w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
