import { Markdown } from '@/components/content/markdown.tsx';
import { ArrowDownToLine, Check, Clipboard, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

interface SummaryDisplayProps {
  summaryText: string;
  onClose: () => void;
  onInsert: (text: string) => void;
}

export const SummaryDisplay = ({
  summaryText,
  onClose,
  onInsert,
}: SummaryDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleInsert = () => {
    const formattedText = `\n\n> ## AI Summary\n> ${summaryText.replace(/\n/g, '\n> ')}`;
    onInsert(formattedText);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-4 flex max-h-[40%] flex-col rounded-lg border bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-950/30">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
          <Sparkles size={16} />
          <span>AI Summary</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-zinc-500 hover:bg-blue-200/50 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-blue-900/50 dark:hover:text-zinc-200"
          title="Close Summary"
        >
          <X size={16} />
        </button>
      </div>
      <div className="prose prose-sm dark:prose-invert max-h-60 overflow-y-auto pr-2 text-zinc-700 dark:text-zinc-300">
        <Markdown md={summaryText} />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={handleInsert}
          className="group flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
        >
          <ArrowDownToLine
            size={14}
            className="transition-transform group-hover:scale-110"
          />
          <span>Insert into note</span>
        </button>
        <button
          onClick={handleCopy}
          className="group flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
          disabled={copied}
        >
          {copied ? (
            <Check size={14} className="text-green-500" />
          ) : (
            <Clipboard
              size={14}
              className="transition-transform group-hover:scale-110"
            />
          )}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
};
