import type { NoteModalRef } from '@/types/note-modal-ref';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode, createRef } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { NoteModal } from './note-modal';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    ViewTransition: ({ children }: { children: ReactNode }) => children,
  };
});
vi.mock('@/data/ai.ts', () => ({
  summarize: vi.fn(),
  extractActionItems: vi.fn(),
  suggestTags: vi.fn(),
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ isSuccess: false }),
}));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => vi.fn() }));
vi.mock('@/routes/_auth/notes/$category/$id.tsx', () => ({
  Route: { useParams: () => ({ category: 'active', id: 'new' }) },
}));
vi.mock('@/components/content/markdown.tsx', () => ({
  Markdown: ({ md }: { md: string }) => <div data-testid="preview">{md}</div>,
}));
vi.mock('@/components/card/popover/tag-input-popover.tsx', () => ({
  TagInputPopover: () => <input aria-label="Tag input" />,
}));
Object.defineProperties(Range.prototype, {
  getClientRects: { value: () => [], configurable: true },
  getBoundingClientRect: { value: () => new DOMRect(), configurable: true },
});
afterEach(cleanup);

it('keeps the saved timestamp unchanged while editing the title', () => {
  const updatedAt = Date.now() - 7_200_000;
  render(
    <NoteModal
      ref={createRef<NoteModalRef>()}
      onClose={vi.fn()}
      note={{
        id: 'test',
        title: 'Example',
        content: 'Body',
        category: 'active',
        createdAt: updatedAt - 86_400_000,
        updatedAt,
      }}
    />,
  );
  const time = screen.getByText('Updated 2 hours ago');
  fireEvent.change(screen.getByPlaceholderText('Title'), {
    target: { value: 'Edited title' },
  });
  expect(time.getAttribute('datetime')).toBe(new Date(updatedAt).toISOString());
  expect(time.textContent).toBe('Updated 2 hours ago');
});

it('does not show timestamps for a new note', () => {
  const { container } = render(
    <NoteModal ref={createRef<NoteModalRef>()} onClose={vi.fn()} note={null} />,
  );
  expect(container.querySelector('time')).toBeNull();
});

it.each([
  { key: 'Enter', keyCode: 13, metaKey: true },
  { key: 'Enter', keyCode: 13, ctrlKey: true },
  { key: 'Escape', keyCode: 27 },
])('saves and closes from the real editor with $key', async (keys) => {
  const onClose = vi.fn();
  const ref = createRef<NoteModalRef>();
  render(
    <div role="dialog" aria-modal="true">
      <NoteModal
        ref={ref}
        onClose={onClose}
        note={{
          id: 'test',
          title: 'Example',
          content: 'Original body',
          category: 'active',
        }}
      />
    </div>,
  );
  const editor = await screen.findByRole('textbox', { name: 'Note content' });
  fireEvent.keyDown(editor, keys);
  expect(onClose).toHaveBeenCalledExactlyOnceWith('save');
  expect(ref.current?.note?.content).toBe('Original body');
});
it('keeps one editor view and saves without stealing editor undo', () => {
  const onClose = vi.fn();
  render(
    <div role="dialog" aria-modal="true">
      <NoteModal
        ref={createRef<NoteModalRef>()}
        onClose={onClose}
        note={{
          id: 'test',
          title: 'Example',
          content: 'Note body',
          category: 'active',
        }}
      />
    </div>,
  );
  const title = screen.getByPlaceholderText('Title');
  fireEvent.keyDown(title, { key: 'p', ctrlKey: true, shiftKey: true });
  expect(screen.queryByTestId('preview')).toBeNull();
  expect(screen.getByLabelText('Note content').textContent).toBe('Note body');
  expect(screen.queryByText(/Preview Mode/)).toBeNull();
  fireEvent.keyDown(document, { key: 'p', metaKey: true, shiftKey: true });
  expect(screen.queryByTestId('preview')).toBeNull();
  fireEvent.keyDown(screen.getByLabelText('Note content'), {
    key: 'z',
    metaKey: true,
  });
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.keyDown(screen.getByPlaceholderText('Title'), {
    key: 'Enter',
    ctrlKey: true,
  });
  expect(onClose).toHaveBeenCalledWith('save');
});
it('Escape closes the tag menu before saving and closing the modal', () => {
  const onClose = vi.fn();
  render(
    <div role="dialog" aria-modal="true">
      <NoteModal
        ref={createRef<NoteModalRef>()}
        onClose={onClose}
        note={{
          id: 'test',
          title: 'Example',
          content: 'Note body',
          category: 'active',
        }}
      />
    </div>,
  );
  fireEvent.click(screen.getByText('Manage Tags').closest('button')!);
  fireEvent.keyDown(screen.getByLabelText('Tag input'), { key: 'Escape' });
  expect(screen.queryByLabelText('Tag input')).toBeNull();
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledWith('save');
});

it('Escape dismisses the real link editor before closing the note', async () => {
  const onClose = vi.fn();
  render(
    <div role="dialog" aria-modal="true">
      <NoteModal
        ref={createRef<NoteModalRef>()}
        onClose={onClose}
        note={{
          id: 'test',
          title: 'Example',
          content: 'Original body',
          category: 'active',
        }}
      />
    </div>,
  );
  await screen.findByRole('textbox', { name: 'Note content' });
  fireEvent.click(screen.getByRole('button', { name: 'Link' }));
  const link = screen.getByRole('textbox', { name: 'Link URL' });
  fireEvent.keyDown(link, { key: 'Escape', keyCode: 27 });
  expect(screen.queryByRole('textbox', { name: 'Link URL' })).toBeNull();
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.keyDown(screen.getByRole('textbox', { name: 'Note content' }), {
    key: 'Escape',
    keyCode: 27,
  });
  expect(onClose).toHaveBeenCalledExactlyOnceWith('save');
});

it('Escape closes the AI menu while focus stays in the editor', async () => {
  const onClose = vi.fn();
  render(
    <div role="dialog" aria-modal="true">
      <NoteModal
        ref={createRef<NoteModalRef>()}
        onClose={onClose}
        note={{
          id: 'test',
          title: 'Example',
          content: 'Original body',
          category: 'active',
        }}
      />
    </div>,
  );
  const editor = await screen.findByRole('textbox', { name: 'Note content' });
  fireEvent.click(screen.getByText('AI Actions').closest('button')!);
  expect(screen.getByText('Extract action items')).toBeDefined();
  fireEvent.keyDown(editor, { key: 'Escape', keyCode: 27 });
  expect(screen.queryByText('Extract action items')).toBeNull();
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.keyDown(editor, { key: 'Escape', keyCode: 27 });
  expect(onClose).toHaveBeenCalledExactlyOnceWith('save');
});
