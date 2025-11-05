import { ReactNode, useEffect, useRef, useState } from 'react';

import { Portal } from './portal.tsx';

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
}

export const DropdownMenu = ({ trigger, children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 10,
        left: rect.right,
      });
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative">
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <Portal>
          <div
            ref={menuRef}
            style={{ top: `${position.top}px`, left: `${position.left}px` }}
            className="fixed z-50 w-32 -translate-y-full rounded-md border bg-white p-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-700"
            onClick={() => setIsOpen(false)}
          >
            {children}
          </div>
        </Portal>
      )}
    </div>
  );
};
