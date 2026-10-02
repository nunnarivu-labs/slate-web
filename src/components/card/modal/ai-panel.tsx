import {
  ArrowDownToLine,
  Check,
  Clipboard,
  FileText,
  ListChecks,
  Loader2,
  RotateCw,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Markdown } from '../../content/markdown';

export type AiTab = 'summary' | 'actions';
export type SummaryLength = 'brief' | 'detailed';

export function parseActionItems(content: string): string[] {
  const items: string[] = [];
  for (const line of content.split('\n')) {
    const match = line.match(
      /^\s*(?:[-*+]\s+|\d+[.)]\s+)(?:\[([ xX])\]\s*)?(.+)$/,
    );
    if (match) {
      if (!match[1]?.trim()) items.push(match[2].trim());
    } else if (
      line.trim() &&
      items.length &&
      !/^\s*(?:#|```|No action items)/i.test(line)
    ) {
      items[items.length - 1] += ` ${line.trim()}`;
    }
  }
  return items;
}

type AiPanelProps = {
  tab: AiTab;
  onTabChange: (tab: AiTab) => void;
  summaryLength: SummaryLength;
  onSummaryLengthChange: (length: SummaryLength) => void;
  summary: string;
  actionItems: string;
  isProcessing: boolean;
  isLoading: boolean;
  error: string;
  onRegenerate: () => void;
  onClose: () => void;
  onInsert: (text: string) => void;
};

const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800';

export function AiPanel({
  tab,
  onTabChange,
  summaryLength,
  onSummaryLengthChange,
  summary,
  actionItems,
  isProcessing,
  isLoading,
  error,
  onRegenerate,
  onClose,
  onInsert,
}: AiPanelProps) {
  const id = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  );
  const [inserted, setInserted] = useState(false);
  const items = parseActionItems(actionItems);
  const selectedItems = items.filter((_, index) => selected.includes(index));
  const result =
    tab === 'summary'
      ? summary
      : selectedItems.map((item) => `- [ ] ${item}`).join('\n');

  useEffect(() => {
    setSelected(parseActionItems(actionItems).map((_, index) => index));
  }, [actionItems]);
  useEffect(() => {
    setCopyState('idle');
    setInserted(false);
  }, [tab, summaryLength, summary, actionItems, selected]);
  useEffect(() => {
    if (copyState !== 'copied') return;
    const timer = setTimeout(() => setCopyState('idle'), 2000);
    return () => clearTimeout(timer);
  }, [copyState]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return (
    <>
      <button
        aria-label="Dismiss AI panel"
        onClick={onClose}
        className="absolute inset-0 z-10 rounded-lg bg-black/30 lg:hidden"
      />
      <aside
        aria-label="AI assistant"
        className="absolute inset-x-0 bottom-0 z-20 flex h-[75%] min-h-0 flex-col rounded-t-2xl border border-zinc-200 bg-zinc-50 shadow-xl lg:relative lg:inset-auto lg:h-auto lg:w-[400px] lg:shrink-0 lg:rounded-none lg:rounded-r-lg lg:border-y-0 lg:border-r-0 lg:shadow-none dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div
          aria-hidden="true"
          className="mx-auto mt-2 h-1 w-9 rounded-full bg-zinc-300 lg:hidden dark:bg-zinc-600"
        />
        <header className="flex shrink-0 items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <Sparkles size={17} className="text-blue-600 dark:text-blue-400" />
            AI assistant
          </div>
          <button
            ref={closeRef}
            aria-label="Close AI panel"
            onClick={onClose}
            className={secondaryButton}
          >
            <X size={16} />
          </button>
        </header>
        <div
          role="tablist"
          aria-label="AI results"
          className="mx-5 flex shrink-0 gap-1 rounded-lg bg-zinc-200/60 p-1 dark:bg-zinc-800"
        >
          {(['summary', 'actions'] as const).map((value) => (
            <button
              key={value}
              id={`${id}-${value}`}
              role="tab"
              aria-selected={tab === value}
              aria-controls={`${id}-result`}
              tabIndex={tab === value ? 0 : -1}
              onKeyDown={(event) => {
                if (
                  ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
                ) {
                  event.preventDefault();
                  const next =
                    event.key === 'Home'
                      ? 'summary'
                      : event.key === 'End'
                        ? 'actions'
                        : tab === 'summary'
                          ? 'actions'
                          : 'summary';
                  onTabChange(next);
                  document.getElementById(`${id}-${next}`)?.focus();
                }
              }}
              onClick={() => onTabChange(value)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-blue-500 ${tab === value ? 'bg-white text-blue-600 shadow-sm dark:bg-zinc-700 dark:text-blue-400' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
            >
              {value === 'summary' ? (
                <FileText size={15} />
              ) : (
                <ListChecks size={15} />
              )}
              {value === 'summary'
                ? 'Summary'
                : `Action items${items.length ? ` · ${items.length}` : ''}`}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-2 px-5 pt-5 pb-3">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {tab === 'summary'
              ? 'Summary'
              : `Action items${items.length ? ` · ${items.length}` : ''}`}
          </h4>
          {tab === 'summary' ? (
            <div
              role="group"
              aria-label="Summary length"
              className="flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700"
            >
              {(['brief', 'detailed'] as const).map((length) => (
                <button
                  key={length}
                  aria-pressed={summaryLength === length}
                  disabled={isProcessing}
                  onClick={() => onSummaryLengthChange(length)}
                  className={`rounded-md px-2 py-1 text-xs capitalize disabled:opacity-40 ${summaryLength === length ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}
                >
                  {length}
                </button>
              ))}
            </div>
          ) : (
            items.length > 0 && (
              <button
                disabled={isLoading}
                onClick={() =>
                  setSelected(
                    selected.length === items.length
                      ? []
                      : items.map((_, index) => index),
                  )
                }
                className="text-xs font-medium text-blue-600 dark:text-blue-400"
              >
                {selected.length === items.length
                  ? 'Deselect all'
                  : 'Select all'}
              </button>
            )
          )}
        </div>
        <div
          id={`${id}-result`}
          role="tabpanel"
          aria-labelledby={`${id}-${tab}`}
          aria-busy={isLoading}
          tabIndex={0}
          className="min-h-0 flex-1 overflow-y-auto px-5 pb-5"
        >
          {error && (
            <p
              role="alert"
              className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
            >
              {error}
            </p>
          )}
          {isLoading ? (
            <div
              role="status"
              className="flex items-center gap-2 py-8 text-sm text-zinc-500"
            >
              <Loader2 size={16} className="animate-spin" />
              {tab === 'summary'
                ? 'Writing your summary…'
                : 'Finding action items…'}
            </div>
          ) : tab === 'summary' ? (
            summary ? (
              <Markdown
                md={summary}
                className="ai-result prose-sm max-w-none text-zinc-700 dark:text-zinc-300"
              />
            ) : (
              <p className="py-6 text-sm text-zinc-500">
                Generate a summary to see the main ideas and key takeaways.
              </p>
            )
          ) : items.length > 0 ? (
            <>
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                Choose the tasks to add to your note.
              </p>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <label
                    key={`${index}-${item}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${selected.includes(index) ? 'border-blue-200 bg-white dark:border-blue-900 dark:bg-zinc-800' : 'border-zinc-200 bg-transparent dark:border-zinc-700'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(index)}
                      onChange={(event) =>
                        setSelected((prev) =>
                          event.target.checked
                            ? [...prev, index]
                            : prev.filter((value) => value !== index),
                        )
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                    />
                    <Markdown
                      md={item}
                      className="ai-task prose-sm max-w-none min-w-0 text-zinc-700 dark:text-zinc-300"
                    />
                  </label>
                ))}
              </div>
            </>
          ) : (
            <p className="py-6 text-sm text-zinc-500">
              {actionItems
                ? 'No action items found in this note.'
                : 'Extract action items to find the next steps in your note.'}
            </p>
          )}
        </div>
        <footer className="shrink-0 space-y-3 border-t border-zinc-200 bg-white p-5 lg:rounded-br-lg dark:border-zinc-700 dark:bg-zinc-900">
          {tab === 'actions' && items.length > 0 && (
            <p className="text-xs text-zinc-500" aria-live="polite">
              {selected.length} of {items.length} selected
            </p>
          )}
          <button
            disabled={!result || isLoading || inserted}
            onClick={() => {
              onInsert(
                `\n\n## ${tab === 'summary' ? 'Summary' : 'Action items'}\n\n${result}`,
              );
              setInserted(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-40"
          >
            {inserted ? <Check size={16} /> : <ArrowDownToLine size={16} />}
            {inserted
              ? 'Added to note'
              : tab === 'summary'
                ? 'Insert into note'
                : 'Add selected to note'}
          </button>
          <div className="flex items-center justify-between">
            <button
              disabled={!result || isLoading}
              onClick={() => void copy()}
              className={secondaryButton}
            >
              {copyState === 'copied' ? (
                <Check size={14} />
              ) : (
                <Clipboard size={14} />
              )}
              {copyState === 'copied' ? 'Copied' : 'Copy'}
            </button>
            <button
              disabled={isProcessing}
              onClick={onRegenerate}
              className={secondaryButton}
            >
              <RotateCw size={14} />
              {error ? 'Try again' : 'Regenerate'}
            </button>
          </div>
          <p role="status" className="text-xs text-zinc-500">
            {copyState === 'error'
              ? 'Copy failed. Please try again.'
              : inserted
                ? 'Your selected content has been added to the end of the note.'
                : ''}
          </p>
        </footer>
      </aside>
    </>
  );
}
