import { Editor } from '@tiptap/react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it } from 'vitest';

import { createEditorExtensions } from './editor-extensions';
import { Markdown } from './markdown';

// Check the shared stylesheet against the two real DOM structures. jsdom can
// check CSS rules; browser layout and screenshot verification remain separate.
const styles = readFileSync('src/styles.css', 'utf8');
const spacingStyles = styles.slice(styles.indexOf('/* Shared rhythm'));

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
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

it('handles the different checklist DOM structures without inherited list padding', () => {
  const content = '- [ ] First\n- [x] Second\n  - [ ] Nested';
  const editor = new Editor({
    extensions: createEditorExtensions(),
    contentType: 'markdown',
    content,
  });
  try {
    document.head.innerHTML = `<style>${spacingStyles}</style>`;
    document.body.innerHTML = `<div class="note-content tiptap" id="editing">${editor.getHTML()}</div><div id="reading">${renderToStaticMarkup(<Markdown md={content} />)}</div>`;
    const lists = document.querySelectorAll(
      'ul[data-type="taskList"], ul.contains-task-list',
    );
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
