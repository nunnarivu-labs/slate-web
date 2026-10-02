import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { AiPanel, type AiTab, parseActionItems } from './ai-panel';

afterEach(cleanup);

function setup(
  actionItems = '- [ ] Start the POC\n- [ ] Review security (Sam, Friday)',
) {
  const onInsert = vi.fn();
  const onRegenerate = vi.fn();
  function Harness() {
    const [tab, setTab] = useState<AiTab>('actions');
    return (
      <AiPanel
        tab={tab}
        onTabChange={setTab}
        summaryLength="brief"
        onSummaryLengthChange={vi.fn()}
        summary={'A short overview.\n\n### Key takeaways\n- Keep latency low'}
        actionItems={actionItems}
        isProcessing={false}
        isLoading={false}
        error=""
        onRegenerate={onRegenerate}
        onClose={vi.fn()}
        onInsert={onInsert}
      />
    );
  }
  render(<Harness />);
  return { onInsert, onRegenerate };
}

it('adds only selected tasks as unchecked Markdown and preserves selection across tabs', () => {
  const { onInsert } = setup();
  fireEvent.click(screen.getAllByRole('checkbox')[0]);
  fireEvent.click(screen.getByRole('tab', { name: 'Summary' }));
  expect(screen.getByText('A short overview.')).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: /Action items/ }));
  expect((screen.getAllByRole('checkbox')[0] as HTMLInputElement).checked).toBe(
    false,
  );
  expect(screen.getByText('1 of 2 selected')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Add selected to note' }));
  expect(onInsert).toHaveBeenCalledWith(
    '\n\n## Action items\n\n- [ ] Review security (Sam, Friday)',
  );
  expect(
    (screen.getByRole('button', { name: 'Added to note' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
});

it('disables insertion and copying with no selected tasks and supports selecting all again', () => {
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Deselect all' }));
  expect(
    (
      screen.getByRole('button', {
        name: 'Add selected to note',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(
    (screen.getByRole('button', { name: 'Copy' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
  expect(screen.getByText('2 of 2 selected')).toBeTruthy();
});

it('handles a note without tasks and lets the user regenerate', () => {
  const { onRegenerate } = setup('No action items found.');
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  expect(screen.getByText('No action items found in this note.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
  expect(onRegenerate).toHaveBeenCalledOnce();
});

it('parses checklist and numbered tasks without including completed tasks', () => {
  expect(
    parseActionItems('- [ ] First\n  continuation\n- [x] Completed\n1. Second'),
  ).toEqual(['First continuation', 'Second']);
});
