import { ToolbarButton } from '@/components/card/toolbar-button.tsx';
import {
  Archive,
  Bell,
  Image as ImageIcon,
  MoreVertical,
  Palette,
  Redo,
  Undo,
  UserPlus,
} from 'lucide-react';

type ExpandedCardProps = {
  isModalOpen: boolean;
  modalContentRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  note: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setTitle: (value: string) => void;
  handleTextareaInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  closeModal: () => void;
};

// 2. The expanded card content, which will be shown inside the modal
export const ExpandedCardContent = ({
  isModalOpen,
  modalContentRef,
  title,
  note,
  textareaRef,
  setTitle,
  handleTextareaInput,
  closeModal,
}: ExpandedCardProps) => (
  <div
    ref={modalContentRef}
    onClick={(e) => e.stopPropagation()}
    className={`w-full max-w-[600px] rounded-lg bg-white dark:bg-zinc-800 shadow-2xl flex flex-col transition-all duration-300
               ${isModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
  >
    <div className="p-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full bg-transparent text-lg font-semibold outline-none mb-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
      />
      <textarea
        ref={textareaRef}
        value={note}
        onInput={handleTextareaInput}
        placeholder="Take a note..."
        className="w-full bg-transparent outline-none resize-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
        rows={3}
        autoFocus // This will now work correctly on initial modal open
      />
    </div>
    <div className="flex items-center justify-between mt-2 p-2">
      <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
        <ToolbarButton tooltip="Remind me">
          <Bell size={20} />
        </ToolbarButton>
        <ToolbarButton tooltip="Collaborator">
          <UserPlus size={20} />
        </ToolbarButton>
        <ToolbarButton tooltip="Background options">
          <Palette size={20} />
        </ToolbarButton>
        <ToolbarButton tooltip="Add image">
          <ImageIcon size={20} />
        </ToolbarButton>
        <ToolbarButton tooltip="Archive">
          <Archive size={20} />
        </ToolbarButton>
        <ToolbarButton tooltip="More">
          <MoreVertical size={20} />
        </ToolbarButton>
        <ToolbarButton tooltip="Undo">
          <Undo size={20} />
        </ToolbarButton>
        <ToolbarButton tooltip="Redo">
          <Redo size={20} />
        </ToolbarButton>
      </div>
      <button
        onClick={closeModal}
        className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
);
