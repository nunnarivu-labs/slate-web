import { NoteModal } from '@/components/card/note-modal.tsx';
import { Note } from '@/types/note.ts';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';

interface CardDialogProps {
  note: Note | null;
}

export const CardDialog = ({ note }: CardDialogProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClose = useCallback(() => {
    navigate({ to: '/notes' });
  }, []);

  return (
    <div
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
      className={
        'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 transition-opacity duration-200 opacity-100'
      }
    >
      <NoteModal noteToEdit={note} onClose={handleClose} onSave={handleClose} />
    </div>
  );
};
