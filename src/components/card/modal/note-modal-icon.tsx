import { ReactNode } from 'react';

export const NoteModalIcon = ({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
};
