import { AddNoteCard } from '@/components/card/add-note-card.tsx';
import { NoteCard } from '@/components/card/note-card.tsx';
import { Loader } from '@/components/loader.tsx';
import { Route } from '@/routes/_auth/notes/$category/route.tsx';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { api } from '../../convex/_generated/api';

export const NotesApp = () => {
  const navigate = useNavigate();
  const params = Route.useParams();

  const notesQuery = useQuery(
    convexQuery(api.tasks.fetchNotes, { category: params.category }),
  );

  if (notesQuery.isFetching) {
    return <Loader text={`Loading ${params.category} notes`} />;
  } else if (notesQuery.isSuccess) {
    const notes = notesQuery.data;

    return (
      <div className="p-4 md:p-8">
        <div className="mb-8 flex">
          <AddNoteCard
            onClick={() =>
              navigate({
                to: '/notes/$category/$id',
                params: { category: params.category, id: 'new' },
              })
            }
          />
        </div>
        <div className="col-auto grid grid-cols-2 justify-center gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() =>
                navigate({
                  to: '/notes/$category/$id',
                  params: { id: note.id, category: params.category },
                })
              }
            />
          ))}
        </div>
      </div>
    );
  }

  return <Loader />;
};
