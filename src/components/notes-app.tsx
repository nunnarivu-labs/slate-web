import { AddNoteCard } from '@/components/card/add-note-card.tsx';
import { NoteCard } from '@/components/card/note-card.tsx';
import { Route } from '@/routes/notes/$category/route.tsx';
import { useNavigate, useParams } from '@tanstack/react-router';

export const NotesApp = () => {
  const navigate = useNavigate();
  const params = useParams({ from: '/notes/$category' });

  const notes = Route.useLoaderData();

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
      <div className="flex flex-wrap items-start justify-center gap-4">
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
};
