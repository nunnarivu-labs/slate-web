import { NoteCard } from '@/components/card/note-card.tsx';
import { useNoteCloseHighlight } from '@/components/feedback/note-close-highlight.tsx';
import { useNoteMoveUndo } from '@/components/feedback/note-move-undo.tsx';
import { Loader } from '@/components/loader.tsx';
import { MasonryGrid } from '@/components/masonry-grid.tsx';
import { Route } from '@/routes/_auth/notes/$category/route.tsx';
import { NoteCategory } from '@/types/note-category.ts';
import { Note } from '@/types/note.ts';
import { normalizeSearchQuery } from '@/utils/search-query.ts';
import { convexQuery } from '@convex-dev/react-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Id } from 'convex/_generated/dataModel';
import { useMutation, usePaginatedQuery } from 'convex/react';
import { Search, X } from 'lucide-react';
import { ViewTransition, useDeferredValue, useEffect, useState } from 'react';

import { api } from '../../convex/_generated/api';

export const NotesApp = () => {
  const { highlightedNoteId } = useNoteCloseHighlight();
  const navigate = useNavigate();
  const moveNote = useMutation(api.tasks.moveNote);
  const offerUndo = useNoteMoveUndo();
  const handleMove = async (note: Note, category: NoteCategory) => {
    const previousCategory = await moveNote({
      id: note.id as Id<'notes'>,
      category,
    });
    if (
      previousCategory !== category &&
      (category === 'archive' || category === 'trash')
    ) {
      offerUndo({ noteId: note.id as Id<'notes'>, previousCategory, category });
    }
  };
  const params = Route.useParams();
  const search = Route.useSearch();

  const queryText = normalizeSearchQuery(search.q ?? '');
  const isSearching = Boolean(queryText);
  const searchQuery = usePaginatedQuery(
    api.tasks.searchNotes,
    isSearching
      ? {
          query: queryText,
          category: params.category,
          tagIds: search.tags as Id<'tags'>[] | undefined,
        }
      : 'skip',
    { initialNumItems: 24 },
  );
  // Tag filtering can produce an empty page even when later matches exist.
  // Continue until we find a result or exhaust the search, avoiding false empties.
  useEffect(() => {
    if (
      isSearching &&
      searchQuery.results.length === 0 &&
      searchQuery.status === 'CanLoadMore'
    ) {
      searchQuery.loadMore(24);
    }
  }, [
    isSearching,
    searchQuery.results.length,
    searchQuery.status,
    searchQuery.loadMore,
  ]);

  const notesQuery = useQuery({
    ...convexQuery(
      api.tasks.fetchNotes,
      isSearching
        ? 'skip'
        : {
            category: params.category,
            tagIds: search.tags as Id<'tags'>[] | undefined,
          },
    ),
    placeholderData: keepPreviousData,
  });

  const collectionKey = JSON.stringify([
    params.category,
    queryText,
    search.tags ?? [],
  ]);
  const resolvedNotes = isSearching
    ? searchQuery.status !== 'LoadingFirstPage'
      ? searchQuery.results
      : undefined
    : !notesQuery.isPlaceholderData
      ? notesQuery.data
      : undefined;
  // Keep the applied filters paired with their resolved data during transitions.
  const [collection, setCollection] = useState<{
    key: string;
    category: NoteCategory;
    notes: Note[];
  }>();
  if (
    resolvedNotes &&
    (collection?.notes !== resolvedNotes || collection.key !== collectionKey)
  ) {
    setCollection({
      key: collectionKey,
      category: params.category,
      notes: resolvedNotes,
    });
  }

  // Defer external-store updates so React can animate their committed layout.
  const renderedCollection = useDeferredValue(collection);
  const notes = renderedCollection?.notes;

  const isUpdating =
    renderedCollection?.key !== collectionKey ||
    collection !== renderedCollection ||
    (isSearching
      ? searchQuery.status === 'LoadingFirstPage'
      : notesQuery.isFetching);
  const isScanningTags =
    isSearching &&
    searchQuery.results.length === 0 &&
    searchQuery.status !== 'Exhausted';
  const clearSearch = () =>
    void navigate({
      to: '/notes/$category',
      params: { category: params.category },
      search: { ...search, q: undefined },
      replace: true,
    });

  if (search.q && !isSearching) {
    return (
      <div className="px-4 pt-24 text-center">
        <p className="text-sm text-zinc-500">
          Enter a word or number to search your notes.
        </p>
        <button
          onClick={clearSearch}
          className="mt-3 rounded-lg px-3 py-2 text-sm text-blue-600"
        >
          Clear search
        </button>
      </div>
    );
  }

  if (!notes) {
    return (
      <Loader
        text={
          isSearching ? 'Searching notes…' : `Loading ${params.category} notes`
        }
      />
    );
  } else {
    return (
      <div
        className="px-4 pt-20 pb-6 md:px-8 md:pt-22"
        aria-busy={isUpdating || isScanningTags}
      >
        {search.q && (
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span role="status">
              {isUpdating || isScanningTags
                ? 'Searching…'
                : `Results for “${search.q}”`}
            </span>
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-800"
            >
              <X size={14} />
              Clear
            </button>
          </div>
        )}
        {notes.length === 0 &&
          isSearching &&
          !isUpdating &&
          !isScanningTags && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Search size={28} className="text-zinc-400" />
              <h2 className="font-medium text-zinc-800 dark:text-zinc-200">
                No matching notes
              </h2>
              <p className="max-w-sm text-sm text-zinc-500">
                Try different words
                {search.tags?.length ? ' or remove a tag filter' : ''}. Search
                is limited to your {params.category} notes.
              </p>
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-zinc-800"
              >
                Clear search
              </button>
            </div>
          )}
        {notes.length === 0 &&
          isSearching &&
          (isUpdating || isScanningTags) && (
            <p
              role="status"
              className="py-12 text-center text-sm text-zinc-500"
            >
              Searching notes…
            </p>
          )}
        <ViewTransition
          key={renderedCollection?.category}
          default="none"
          enter="notes-category"
          exit="notes-category"
        >
          <MasonryGrid>
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                highlighted={note.id === highlightedNoteId}
                onMove={(category) => handleMove(note, category)}
                onClick={() =>
                  navigate({
                    to: '/notes/$category/$id',
                    params: { id: note.id, category: note.category },
                    search,
                  })
                }
              />
            ))}
          </MasonryGrid>
        </ViewTransition>
        {isSearching &&
          notes.length > 0 &&
          ['CanLoadMore', 'LoadingMore'].includes(searchQuery.status) && (
            <div className="flex justify-center pt-6">
              <button
                type="button"
                disabled={searchQuery.status === 'LoadingMore'}
                onClick={() => searchQuery.loadMore(24)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {searchQuery.status === 'LoadingMore'
                  ? 'Loading…'
                  : 'Load more results'}
              </button>
            </div>
          )}
      </div>
    );
  }
};
