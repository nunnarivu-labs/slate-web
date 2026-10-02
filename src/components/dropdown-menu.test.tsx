import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { DropdownMenu } from './dropdown-menu';

afterEach(cleanup);

it('mounts, reopens, and closes with Escape while restoring trigger focus', () => {
  render(
    <DropdownMenu trigger={<button>Note actions</button>}>
      <button>Archive note</button>
    </DropdownMenu>,
  );
  const trigger = screen.getByRole('button', { name: 'Note actions' });
  for (let attempt = 0; attempt < 2; attempt++) {
    fireEvent.click(trigger);
    const action = screen.getByRole('button', { name: 'Archive note' });
    action.focus();
    fireEvent.keyDown(action, { key: 'Escape', keyCode: 27 });
    expect(screen.queryByRole('button', { name: 'Archive note' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  }
});

it('closes the dropdown before delivering Escape to its parent dialog', () => {
  const closeModal = vi.fn();
  function Dialog() {
    useKeyboardShortcut('Escape', closeModal, {
      scope: 'editor',
      allowTyping: true,
      priority: 10,
    });
    return (
      <div role="dialog" aria-modal="true">
        <DropdownMenu trigger={<button>Note actions</button>}>
          <button>Archive note</button>
        </DropdownMenu>
      </div>
    );
  }
  render(<Dialog />);
  fireEvent.click(screen.getByRole('button', { name: 'Note actions' }));
  fireEvent.keyDown(screen.getByRole('button', { name: 'Archive note' }), {
    key: 'Escape',
    keyCode: 27,
  });
  expect(closeModal).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Archive note' })).toBeNull();
  fireEvent.keyDown(document, { key: 'Escape', keyCode: 27 });
  expect(closeModal).toHaveBeenCalledOnce();
});
