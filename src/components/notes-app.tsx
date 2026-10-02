import { NoteCard } from '@/components/card/note-card.tsx';
import { Loader } from '@/components/loader.tsx';
import { MasonryGrid } from '@/components/masonry-grid.tsx';
import { Route } from '@/routes/_auth/notes/$category/route.tsx';
import { NoteCategory } from '@/types/note-category.ts';
import { Note } from '@/types/note.ts';
import { convexQuery } from '@convex-dev/react-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Id } from 'convex/_generated/dataModel';
import { ViewTransition, useDeferredValue, useState } from 'react';

import { api } from '../../convex/_generated/api';

export const NotesApp = () => {
  const navigate = useNavigate();
  const params = Route.useParams();
  const search = Route.useSearch();

  const notesQuery = useQuery({
    ...convexQuery(api.tasks.fetchNotes, {
      category: params.category,
      tagIds: search.tags as Id<'tags'>[] | undefined,
    }),
    placeholderData: keepPreviousData,
  });

  // Keep the category paired with its resolved data. Placeholder data still
  // belongs to the previous category and must not trigger an early cross-fade.
  const [collection, setCollection] = useState<{
    category: NoteCategory;
    notes: Note[];
  }>();
  if (
    !notesQuery.isPlaceholderData &&
    notesQuery.data &&
    (collection?.notes !== notesQuery.data ||
      collection?.category !== params.category)
  ) {
    setCollection({ category: params.category, notes: notesQuery.data });
  }

  // Defer external-store updates so React can animate their committed layout.
  const renderedCollection = useDeferredValue(collection);
  const notes = renderedCollection?.notes;

  if (!notes) {
    return <Loader text={`Loading ${params.category} notes`} />;
  } else {
    return (
      <div
        className="px-4 pt-20 pb-6 md:px-8 md:pt-22"
        aria-busy={notesQuery.isFetching || collection !== renderedCollection}
      >
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
      </div>
    );
  }
};
