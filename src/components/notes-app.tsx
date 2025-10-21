import { NoteCard } from '@/components/card/note-card.tsx';
import { useGetNumberOfNotesPerRow } from '@/hooks/use-get-number-of-notes-per-row.ts';
import { Route } from '@/routes/notes/$category/route.tsx';
import { createMasonryColumns } from '@/utils/create-masonry-columns.ts';
import { useNavigate, useParams } from '@tanstack/react-router';

export const NotesApp = () => {
  const navigate = useNavigate();
  const params = useParams({ from: '/notes/$category' });

  const masonryColumns = createMasonryColumns(
    Route.useLoaderData(),
    useGetNumberOfNotesPerRow(),
  );

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-row items-start justify-center gap-4">
        {masonryColumns.map((column, colIndex) => (
          <div key={colIndex} className="flex w-full flex-col gap-4">
            {column.map((note) => (
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
        ))}
      </div>
    </div>
  );
};
