import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const HighlightContext = createContext<{
  highlightedNoteId?: string;
  highlightNote: (noteId: string) => void;
} | null>(null);

export function NoteCloseHighlightProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [highlight, setHighlight] = useState<{ noteId: string }>();
  const highlightNote = useCallback((noteId: string) => {
    setHighlight({ noteId });
  }, []);

  useEffect(() => {
    if (!highlight) return;
    const timer = setTimeout(() => setHighlight(undefined), 1600);
    return () => clearTimeout(timer);
  }, [highlight]);

  return (
    <HighlightContext.Provider
      value={{ highlightedNoteId: highlight?.noteId, highlightNote }}
    >
      {children}
    </HighlightContext.Provider>
  );
}

export function useNoteCloseHighlight() {
  const context = useContext(HighlightContext);
  if (!context)
    throw new Error('Note highlight requires NoteCloseHighlightProvider.');
  return context;
}
