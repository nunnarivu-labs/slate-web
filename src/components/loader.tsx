import { Loader2 } from 'lucide-react';

type LoaderProps = {
  text?: string;
};

export const Loader = ({ text = 'Loading...' }: LoaderProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-zinc-950/50"
    role="status"
    aria-live="polite"
  >
    <div className="flex flex-col items-center justify-center gap-4 text-zinc-500 dark:text-zinc-400">
      <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
      <p className="text-lg font-medium">{text}</p>
    </div>
  </div>
);
