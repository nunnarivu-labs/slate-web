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
      className="group relative cursor-pointer rounded-full p-2 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-700"
    >
      {children}
      {tooltip && (
        <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-zinc-700 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {tooltip}
        </span>
      )}
    </button>
  );
};
