import { AddNoteCard } from '@/components/card/add-note-card.tsx';
import { NoteCard } from '@/components/card/note-card.tsx';
import { Loader } from '@/components/loader.tsx';
import { MasonryGrid } from '@/components/masonry-grid.tsx';
import { Route } from '@/routes/_auth/notes/$category/route.tsx';
import { convexQuery } from '@convex-dev/react-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Id } from 'convex/_generated/dataModel';
import { useDeferredValue } from 'react';

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

  // Convex publishes external-store updates synchronously. Defer the rendered
  // data so React can capture the old layout before committing the new grid.
  const notes = useDeferredValue(notesQuery.data);

  if (!notes) {
    return <Loader text={`Loading ${params.category} notes`} />;
  } else {
    return (
      <div
        className="p-4 md:p-8"
        aria-busy={notesQuery.isFetching || notes !== notesQuery.data}
      >
        <div className="mb-8 flex">
          <AddNoteCard
            onClick={() =>
              navigate({
                to: '/notes/$category/$id',
                params: { category: params.category, id: 'new' },
                search,
              })
            }
          />
        </div>
        <MasonryGrid>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() =>
                navigate({
                  to: '/notes/$category/$id',
                  params: { id: note.id, category: params.category },
                  search,
                })
              }
            />
          ))}
        </MasonryGrid>
      </div>
    );
  }
};
