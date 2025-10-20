import { ReactNode } from 'react';

export const NoteModalIcon = ({ children }: { children: ReactNode }) => {
  return (
    <button className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer">
      {children}
    </button>
  );
};
