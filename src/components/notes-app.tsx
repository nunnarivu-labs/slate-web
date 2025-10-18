import { AddNoteCard } from '@/components/card/add-note-card.tsx';
import { ExistingNoteCard } from '@/components/card/existing-note-card.tsx';
import { Route } from '@/routes/notes/route.tsx';
import { useNavigate } from '@tanstack/react-router';

export const NotesApp = () => {
  const navigate = useNavigate();
  const notes = Route.useLoaderData();

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <AddNoteCard onClick={() => navigate({ to: '/notes/new' })} />
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {notes.map((note) => (
          <ExistingNoteCard
            key={note.id}
            note={note}
            onClick={() =>
              navigate({ to: '/notes/$id', params: { id: note.id } })
            }
          />
        ))}
      </main>
    </div>
  );
};
