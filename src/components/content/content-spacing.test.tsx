import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Editor } from '@tiptap/react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it } from 'vitest';

import { ContentEditor } from './content-editor';
import { createEditorExtensions } from './editor-extensions';
import { Markdown } from './markdown';

// Check the shared stylesheet against the two real DOM structures. jsdom can
// check CSS rules; browser layout and screenshot verification remain separate.
const styles = readFileSync('src/styles.css', 'utf8');
const spacingStyles = styles.slice(styles.indexOf('/* Shared rhythm'));

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

it('changes the link cursor for modifier hover and resets on release, exit, and window blur', async () => {
  document.head.innerHTML = `<style>${spacingStyles}</style>`;
  render(
    <ContentEditor
      content="[Example](https://example.com)"
      onChange={() => {}}
    />,
  );
  const editor = await screen.findByRole('textbox', { name: 'Note content' });
  const link = editor.querySelector('a')!;
  const cursor = () => getComputedStyle(link).cursor;
  expect(cursor()).toBe('text');
  fireEvent.keyDown(window, { key: 'Meta', metaKey: true });
  expect(cursor()).toBe('pointer');
  fireEvent.keyUp(window, { key: 'Meta' });
  expect(cursor()).toBe('text');
  fireEvent.mouseMove(link, { ctrlKey: true });
  expect(cursor()).toBe('pointer');
  fireEvent.blur(window);
  expect(cursor()).toBe('text');
  fireEvent.mouseMove(link, { metaKey: true });
  expect(cursor()).toBe('pointer');
  fireEvent.mouseLeave(link);
  expect(cursor()).toBe('text');
});

it('uses matching spacing for headings, prose, lists, quotes, and code in both renderers', () => {
  const content =
    '## Heading\n\nFirst paragraph\n\nSecond paragraph\n\n- First item\n- Second item\n  - Nested item\n\n> Quote\n\n```\ncode\n```';
  const editor = new Editor({
    extensions: createEditorExtensions(),
    contentType: 'markdown',
    content,
  });
  try {
    document.head.innerHTML = `<style>${spacingStyles}</style>`;
    document.body.innerHTML = `<div class="note-content tiptap" id="editing">${editor.getHTML()}</div><div id="reading">${renderToStaticMarkup(<Markdown md={content} />)}</div>`;
    for (const selector of [
      'h2',
      'p',
      'ul',
      'li',
      'li ul',
      'blockquote',
      'pre',
    ]) {
      const editing = document.querySelector(`#editing ${selector}`)!;
      const reading = document.querySelector(`#reading ${selector}`)!;
      expect(editing, selector).not.toBeNull();
      expect(reading, selector).not.toBeNull();
      for (const property of [
        'margin-block',
        'margin-top',
        'margin-bottom',
        'padding',
        'padding-inline-start',
        'line-height',
      ]) {
        expect(
          getComputedStyle(editing).getPropertyValue(property),
          `${selector}: ${property}`,
        ).toBe(getComputedStyle(reading).getPropertyValue(property));
      }
    }
    for (const root of [
      document.querySelector('#editing')!,
      document.querySelector('#reading .note-content')!,
    ]) {
      expect(getComputedStyle(root.firstElementChild!).marginTop).toBe('0px');
      expect(getComputedStyle(root.lastElementChild!).marginBottom).toBe('0px');
      expect(getComputedStyle(root.querySelector('p')!).marginBlock).toBe('0');
    }
  } finally {
    editor.destroy();
  }
});

it('keeps checklists aligned without inherited list padding in editing and previews', () => {
  const content = '- [ ] First\n- [x] Second\n  - [ ] Nested';
  const editor = new Editor({
    extensions: createEditorExtensions(),
    contentType: 'markdown',
    content,
  });
  try {
    document.head.innerHTML = `<style>${spacingStyles}</style>`;
    document.body.innerHTML = `<div class="note-content tiptap" id="editing">${editor.getHTML()}</div><div id="reading">${renderToStaticMarkup(<Markdown md={content} />)}</div>`;
    const lists = document.querySelectorAll('ul[data-type="taskList"]');
    expect(lists.length).toBe(4);
    for (const list of lists) {
      expect(getComputedStyle(list).paddingInlineStart).toBe('0');
      expect(getComputedStyle(list).listStyle).toBe('none');
    }
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (const checkbox of checkboxes)
      expect(getComputedStyle(checkbox).width).toBe('0.875em');
    const label = document.querySelector('#editing li > label')!;
    expect(getComputedStyle(label).height).toBe('1.6em');
  } finally {
    editor.destroy();
  }
});

it('keeps live editor checkboxes beside their text, including after checkbox updates', () => {
  const host = document.createElement('div');
  document.body.append(host);
  document.head.innerHTML = `<style>${spacingStyles}</style>`;
  const editor = new Editor({
    element: host,
    extensions: createEditorExtensions(),
    editorProps: { attributes: { class: 'note-content tiptap' } },
    contentType: 'markdown',
    content: '- [ ] First task\n- [x] Second task\n  - [ ] Nested task',
  });
  try {
    const checkLayout = () => {
      const items = host.querySelectorAll('li[data-checked]');
      expect(items.length).toBe(3);
      for (const item of items) {
        expect(getComputedStyle(item).display).toBe('flex');
        expect(getComputedStyle(item).alignItems).toBe('flex-start');
        expect(
          getComputedStyle(item.querySelector(':scope > label')!).flex,
        ).toBe('0 0 auto');
        expect(
          getComputedStyle(item.querySelector(':scope > div')!).minWidth,
        ).toBe('0');
      }
    };
    checkLayout();
    editor.commands.setTextSelection(3);
    editor.commands.updateAttributes('taskItem', { checked: true });
    expect(
      host.querySelector('li[data-checked]')?.getAttribute('data-checked'),
    ).toBe('true');
    checkLayout();
  } finally {
    editor.destroy();
  }
});

it('keeps empty table cells visible in the editor and preview', () => {
  const content = '| Header |\n| --- |\n| |';
  const editor = new Editor({
    extensions: createEditorExtensions(),
    contentType: 'markdown',
    content,
  });
  try {
    document.head.innerHTML = `<style>${spacingStyles}</style>`;
    document.body.innerHTML = `<div class="note-content tiptap" id="editing">${editor.getHTML()}</div><div id="reading">${renderToStaticMarkup(<Markdown md={content} />)}</div>`;
    for (const selector of ['#editing td p', '#reading td p']) {
      expect(
        getComputedStyle(document.querySelector(selector)!).minHeight,
      ).toBe('1.6em');
    }
  } finally {
    editor.destroy();
  }
});
