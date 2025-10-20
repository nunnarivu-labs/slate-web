import { ReactNode } from 'react';

export const NoteModalIcon = ({
  children,
  onClick,
  disabled = false,
  tooltip,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}) => {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="group relative p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
      {tooltip && (
        <span
          className="
            absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-700 text-white text-xs rounded-md whitespace-nowrap  opacity-0 group-hover:opacity-100  transition-opacity duration-200 pointer-events-none"
        >
          {tooltip}
        </span>
      )}
    </button>
  );
};
