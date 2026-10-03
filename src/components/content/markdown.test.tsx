// @vitest-environment node
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';

import { Markdown } from './markdown';

const render = (md: string) => renderToStaticMarkup(<Markdown md={md} />);

it('renders formatting, line breaks, links, and nested checklists on the server', () => {
  const html = render(
    '# Heading\n\n**bold** *italic* ~~strike~~\nnext line\n\n[Link](https://example.com)\n\n- [x] Done\n  - [ ] Nested\n\n> Quote\n\n1. First\n\n`inline`\n\n```js\nconst x = 1;\n```',
  );
  for (const tag of [
    '<h1',
    '<strong',
    '<em',
    '<s',
    '<br',
    'href="https://example.com"',
    '<blockquote',
    '<ol',
    '<code',
    '<pre',
  ]) {
    expect(html).toContain(tag);
  }
  expect(html.match(/type="checkbox"/g)).toHaveLength(2);
  expect(html.match(/disabled=""/g)).toHaveLength(2);
  expect(html.match(/checked=""/g)).toHaveLength(1);
});

it('renders table alignment and inline formatting without an editor or browser DOM', () => {
  const html = render('| Name | Count |\n| :--- | ---: |\n| **Alice** | 2 |');
  expect(html).toContain('<table');
  expect(html.match(/<th[ >]/g)).toHaveLength(2);
  expect(html.match(/<td[ >]/g)).toHaveLength(2);
  expect(html).toContain('text-align:right');
  expect(html).toContain('<strong>Alice</strong>');
});

it('keeps raw HTML inert and does not render images or executable links', () => {
  const html = render(
    '<script>alert(1)</script>\n\n<b>literal</b>\n\n[bad](javascript:alert%281%29)\n\n![photo](https://example.com/photo.png)',
  );
  expect(html).not.toContain('<script');
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('&lt;b&gt;literal&lt;/b&gt;');
  expect(html).not.toContain('href="javascript:');
  expect(html).not.toContain('<img');
});

it('renders serialized table line breaks and escaped pipes', () => {
  const html = render('| Cell |\n| --- |\n| first<br>second \\| third |');
  expect(html).toContain('first<br/>second | third');
});
