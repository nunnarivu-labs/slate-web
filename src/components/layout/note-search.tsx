import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function NoteSearch() {
  const params = useParams({ from: '/_auth/notes/$category' });
  const search = useSearch({ from: '/_auth/notes/$category' });
  const navigate = useNavigate();
  const [value, setValue] = useState(search.q ?? '');
  const [expanded, setExpanded] = useState(Boolean(search.q));
  const inputRef = useRef<HTMLInputElement>(null);
  const currentSearch = useRef(search);
  currentSearch.current = search;
  const currentCategory = useRef(params.category);
  currentCategory.current = params.category;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setValue(search.q ?? '');
    if (search.q) setExpanded(true);
  }, [search.q, params.category]);
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const commit = (text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = text.trim().slice(0, 256) || undefined;
    if (q === currentSearch.current.q) return;
    void navigate({
      to: '/notes/$category',
      params: { category: currentCategory.current },
      search: { ...currentSearch.current, q },
      replace: true,
      resetScroll: true,
    });
  };
  const clear = () => {
    setValue('');
    commit('');
    inputRef.current?.focus();
  };
  return (
    <div className="pointer-events-auto flex min-w-0 flex-1 justify-end sm:justify-center">
      <button
        type="button"
        aria-label="Search notes"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className={`${expanded ? 'hidden' : 'flex sm:hidden'} h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-400 dark:hover:bg-zinc-800`}
      >
        <Search size={20} />
      </button>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          commit(value);
        }}
        className={`${expanded ? 'flex' : 'hidden sm:flex'} h-10 w-full max-w-md min-w-0 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100/90 px-3 backdrop-blur-md focus-within:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900/90`}
      >
        <Search size={17} className="shrink-0 text-zinc-400" />
        <input
          ref={inputRef}
          type="search"
          aria-label="Search notes"
          placeholder={`Search ${params.category} notes`}
          value={value}
          maxLength={256}
          onChange={(event) => {
            const text = event.target.value;
            setValue(text);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => commit(text), 250);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              clear();
              setExpanded(false);
            }
          }}
          className="w-full min-w-0 bg-transparent text-sm text-zinc-800 outline-none dark:text-zinc-200 [&::-webkit-search-cancel-button]:hidden"
        />
        {(value || expanded) && (
          <button
            type="button"
            aria-label={value ? 'Clear search' : 'Close search'}
            onClick={() => {
              if (value) clear();
              else setExpanded(false);
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-zinc-500 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-800"
          >
            <X size={15} />
          </button>
        )}
      </form>
    </div>
  );
}
