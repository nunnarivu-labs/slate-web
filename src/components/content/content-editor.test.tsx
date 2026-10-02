import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Editor } from '@tiptap/react';
import { createRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ContentEditor } from './content-editor';
import type { ContentEditorRef } from './content-editor';
import { createEditorExtensions } from './editor-extensions';
import { Markdown } from './markdown';

// jsdom has no layout; ProseMirror measures text ranges when focusing.
Object.defineProperties(Range.prototype, {
  getClientRects: { value: () => [], configurable: true },
  getBoundingClientRect: { value: () => new DOMRect(), configurable: true },
});

afterEach(cleanup);

function Harness({ initial = 'Original note' }: { initial?: string }) {
  const [content, setContent] = useState(initial);
  const [preview, setPreview] = useState(false);
  return (
    <>
      <button onClick={() => setPreview(!preview)}>Toggle preview</button>
      <div hidden={preview}>
        <ContentEditor content={content} onChange={setContent} />
      </div>
      {preview && <Markdown md={content} />}
      <output>{content}</output>
    </>
  );
}

describe('Markdown editor', () => {
  it('preserves untouched source and initializes without marking dirty', async () => {
    const ref = createRef<ContentEditorRef>();
    const onChange = vi.fn();
    const source = '*original*\nsecond line';
    render(<ContentEditor ref={ref} content={source} onChange={onChange} />);
    await screen.findByRole('textbox', { name: 'Note content' });
    expect(ref.current?.getMarkdown()).toBe(source);
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole('textbox', { name: 'Note content' }).querySelector('br'),
    ).not.toBeNull();
  });

  it('appends AI Markdown, updates the saved value immediately, and supports undo/redo', async () => {
    const ref = createRef<ContentEditorRef>();
    const onChange = vi.fn();
    render(
      <ContentEditor ref={ref} content="Original note" onChange={onChange} />,
    );
    await screen.findByRole('textbox', { name: 'Note content' });
    fireEvent.click(screen.getByRole('button', { name: 'Heading' }));
    act(() =>
      ref.current?.appendMarkdown('\n\n> ## AI Summary\n> **Summary**'),
    );
    expect(ref.current?.getMarkdown()).toContain('Original note');
    expect(ref.current?.getMarkdown()).toContain('Summary');
    expect(onChange).toHaveBeenLastCalledWith(ref.current?.getMarkdown());
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() =>
      expect(ref.current?.getMarkdown().trim()).toBe('## Original note'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    await waitFor(() =>
      expect(ref.current?.getMarkdown()).toContain('Summary'),
    );
  });

  it('keeps formatting and undo history while the editor is hidden for preview', async () => {
    render(<Harness />);
    await screen.findByRole('textbox', { name: 'Note content' });
    fireEvent.click(screen.getByRole('button', { name: 'Heading' }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        '## Original note',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toggle preview' }));
    expect(
      screen.getByRole('heading', { name: 'Original note' }),
    ).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle preview' }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent?.trim()).toBe(
        'Original note',
      ),
    );
  });

  it('handles external content changes without emitting another edit', async () => {
    const ref = createRef<ContentEditorRef>();
    const onChange = vi.fn();
    const view = render(
      <ContentEditor ref={ref} content="First" onChange={onChange} />,
    );
    await screen.findByRole('textbox', { name: 'Note content' });
    view.rerender(
      <ContentEditor ref={ref} content="**Second**" onChange={onChange} />,
    );
    await waitFor(() => expect(ref.current?.getMarkdown()).toBe('**Second**'));
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole('textbox', { name: 'Note content' })
        .querySelector('strong')?.textContent,
    ).toBe('Second');
  });

  it('server-renders without constructing the interactive editor, and formats note display', () => {
    expect(() =>
      renderToString(<ContentEditor content="**Hello**" onChange={() => {}} />),
    ).not.toThrow();
    expect(renderToString(<Markdown md="**Hello**" />)).toContain(
      '<strong>Hello</strong>',
    );
  });

  it('round-trips supported formats and persists checkbox changes', () => {
    const editor = new Editor({
      extensions: createEditorExtensions(),
      contentType: 'markdown',
      content:
        '# Heading\n\n**bold** *italic* ~~strike~~\n\n- [ ] Task\n\n1. Numbered\n\n> Quote\n\n[Link](https://example.com)\n\n`inline`\n\n```js\nconst x = 1;\n```',
    });
    try {
      let taskPosition = 0;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'taskItem') taskPosition = pos;
      });
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(taskPosition, undefined, {
          checked: true,
        }),
      );
      const markdown = editor.getMarkdown();
      expect(markdown).toContain('- [x] Task');
      editor.commands.setContent(markdown, {
        contentType: 'markdown',
        emitUpdate: false,
      });
      const html = editor.getHTML();
      for (const tag of [
        '<h1',
        '<strong',
        '<em',
        '<s',
        'data-type="taskList"',
        '<ol',
        '<blockquote',
        'href="https://example.com"',
        '<pre',
      ])
        expect(html).toContain(tag);
      expect(editor.getMarkdown()).toBe(markdown);
    } finally {
      editor.destroy();
    }
  });
});
