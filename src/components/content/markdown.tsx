import { Extension } from '@tiptap/core';
import { MarkdownManager } from '@tiptap/markdown';
import { renderToReactElement } from '@tiptap/static-renderer/pm/react';
import { useMemo } from 'react';

import { createEditorExtensions } from './editor-extensions';

type MarkdownProps = {
  md: string;
  className?: string;
};

// Preserve raw HTML as text in previews, including during server rendering.
const literalHtml = Extension.create({
  name: 'literalHtml',
  markdownTokenName: 'html',
  parseMarkdown: (token) => {
    const text = { type: 'text', text: token.raw || token.text || '' };
    return token.block ? { type: 'paragraph', content: [text] } : text;
  },
});
const literalInlineHtml = Extension.create({
  name: 'literalInlineHtml',
  markdownTokenizer: {
    name: 'literalInlineHtml',
    level: 'inline',
    start: (source) => source.indexOf('<'),
    tokenize: (source) => {
      const raw = source.match(/^(?:<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>)/)?.[0];
      return raw ? { type: 'literalInlineHtml', raw, text: raw } : undefined;
    },
  },
  parseMarkdown: (token) => {
    const text = token.raw || token.text || '';
    // Tiptap serializes line breaks inside Markdown table cells as <br>.
    return /^<br\s*\/?\s*>$/i.test(text)
      ? { type: 'hardBreak' }
      : { type: 'text', text };
  },
});
const extensions = [
  ...createEditorExtensions(),
  literalHtml,
  literalInlineHtml,
];
const parser = new MarkdownManager({
  extensions,
  markedOptions: { gfm: true, breaks: true },
});

export const Markdown = ({ md, className }: MarkdownProps) => {
  const content = useMemo(
    () =>
      renderToReactElement({
        extensions,
        content: parser.parse(md),
        options: {
          nodeMapping: {
            taskItem: ({ node, children }) => (
              <li data-type="taskItem" data-checked={node.attrs.checked}>
                <label>
                  <input
                    type="checkbox"
                    checked={node.attrs.checked}
                    disabled
                  />
                </label>
                <div>{children}</div>
              </li>
            ),
          },
        },
      }),
    [md],
  );
  return (
    <div
      className={`note-content markdown-content prose dark:prose-invert grow resize-none text-left ${className ?? ''}`}
    >
      {content}
    </div>
  );
};
