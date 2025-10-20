import { ReactNode } from 'react';

export const NoteModalIcon = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
    >
      {children}
    </button>
  );
};
