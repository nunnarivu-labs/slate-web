import { CollapsedCard } from '@/components/card/collapsed-card.tsx';
import { ExpandedCardContent } from '@/components/card/expanded-card-content.tsx';
import { useEffect, useRef, useState } from 'react';

const NoteCard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const modalContentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const openModal = () => setIsModalOpen(true);

  const closeModal = () => setIsModalOpen(false);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  return (
    <>
      <CollapsedCard onClick={openModal} />

      {isModalOpen && (
        <div
          onClick={closeModal}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-300
                     ${isModalOpen ? 'opacity-100' : 'opacity-0'}`}
        >
          <ExpandedCardContent
            isModalOpen={isModalOpen}
            modalContentRef={modalContentRef}
            title={title}
            note={note}
            textareaRef={textareaRef}
            setTitle={setTitle}
            handleTextareaInput={handleTextareaInput}
            closeModal={closeModal}
          />
        </div>
      )}
    </>
  );
};
export default NoteCard;
