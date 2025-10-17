import { AddNoteCard } from '@/components/card/add-note-card.tsx';
import { ExistingNoteCard } from '@/components/card/existing-note-card.tsx';
import { NoteModal } from '@/components/card/note-modal.tsx';
import { Note } from '@/types/note.ts';
import { useEffect, useRef, useState } from 'react';

const initialNotes: Note[] = [
  { id: '1', title: 'Meeting Prep', content: 'Review Q3 financial reports.' },
  { id: '2', title: 'Grocery List', content: '- Milk\n- Bread\n- Coffee' },
];

export function KeepClonePage() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    noteId?: string | null;
  }>({ isOpen: false });
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState('center');

  const addNoteRef = useRef<HTMLDivElement | null>(null);
  const noteRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const openModal = (
    elementRef: React.RefObject<HTMLDivElement>,
    noteId: string | null = null,
  ) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setTransformOrigin(
        `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`,
      );
    }
    setModalState({ isOpen: true, noteId });
    setIsAnimatingOut(false);
  };

  const closeModal = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setModalState({ isOpen: false });
    }, 200); // Match animation duration
  };

  const handleSaveNote = (noteToSave: Note) => {
    // If the note has an ID, it's an update. Otherwise, it's a new note.
    const isExisting = notes.some((n) => n.id === noteToSave.id);

    if (isExisting) {
      setNotes(notes.map((n) => (n.id === noteToSave.id ? noteToSave : n)));
    } else {
      const newNote = { ...noteToSave, id: Date.now().toString() };
      setNotes((prevNotes) => [newNote, ...prevNotes]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const noteToEdit =
    modalState.isOpen && modalState.noteId
      ? notes.find((n) => n.id === modalState.noteId) || null
      : null;

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <AddNoteCard
          ref={addNoteRef}
          onClick={() => {
            if (addNoteRef.current) {
              openModal({ current: addNoteRef.current });
            }
          }}
        />
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {notes.map((note) => (
          <ExistingNoteCard
            key={note.id}
            note={note}
            onClick={() => {
              const noteRef = noteRefs.current.get(note.id);

              if (noteRef) {
                openModal({ current: noteRef }, note.id);
              }
            }}
            ref={(el) => {
              if (el) noteRefs.current.set(note.id, el);
            }}
          />
        ))}
      </main>

      {modalState.isOpen && (
        <div
          onClick={closeModal}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-200
                     ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}`}
        >
          <div style={{ transformOrigin }}>
            <NoteModal
              noteToEdit={noteToEdit} // Pass null for new notes, object for existing
              onClose={closeModal}
              onSave={handleSaveNote}
              isAnimatingOut={isAnimatingOut}
            />
          </div>
        </div>
      )}
    </div>
  );
}
