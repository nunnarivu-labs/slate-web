import { useEffect, useState } from 'react';

type NoteTimestampsProps = {
  createdAt?: number;
  updatedAt?: number;
};

const units = [
  ['year', 365 * 24 * 60 * 60_000],
  ['month', 30 * 24 * 60 * 60_000],
  ['week', 7 * 24 * 60 * 60_000],
  ['day', 24 * 60 * 60_000],
  ['hour', 60 * 60_000],
  ['minute', 60_000],
] as const;

const exactDate = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});

function relativeUpdate(updatedAt: number, now: number) {
  const elapsed = Math.max(0, now - updatedAt);

  if (elapsed < 60_000) return 'just now';

  const [unit, duration] = units.find(([, duration]) => elapsed >= duration)!;

  return new Intl.RelativeTimeFormat('en', { numeric: 'always' }).format(
    -Math.floor(elapsed / duration),
    unit,
  );
}

export function NoteTimestamps({ createdAt, updatedAt }: NoteTimestampsProps) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (updatedAt === undefined) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [updatedAt]);

  if (createdAt === undefined || updatedAt === undefined) return null;

  return (
    <time
      dateTime={new Date(updatedAt).toISOString()}
      title={`Created: ${exactDate.format(createdAt)}\nLast updated: ${exactDate.format(updatedAt)}`}
      className="min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400"
    >
      Updated {relativeUpdate(updatedAt, now)}
    </time>
  );
}
