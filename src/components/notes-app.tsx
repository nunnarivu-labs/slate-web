import { AddNoteCard } from '@/components/card/add-note-card.tsx';
import { ExistingNoteCard } from '@/components/card/existing-note-card.tsx';
import { useGetNumberOfNotesPerRow } from '@/hooks/use-get-number-of-notes-per-row.ts';
import { Route } from '@/routes/notes/route.tsx';
import { createMasonryColumns } from '@/utils/create-masonry-columns.ts';
import { useNavigate } from '@tanstack/react-router';

export const NotesApp = () => {
  const navigate = useNavigate();

  const masonryColumns = createMasonryColumns(
    Route.useLoaderData(),
    useGetNumberOfNotesPerRow(),
  );

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <AddNoteCard onClick={() => navigate({ to: '/notes/new' })} />
      </header>
      <main className="flex flex-row items-start justify-center gap-4">
        {masonryColumns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-4 w-full">
            {column.map((note) => (
              <ExistingNoteCard
                key={note.id}
                note={note}
                onClick={() =>
                  navigate({ to: '/notes/$id', params: { id: note.id } })
                }
              />
            ))}
          </div>
        ))}
      </main>
    </div>
  );
};
