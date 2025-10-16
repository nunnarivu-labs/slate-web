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
import React, { useEffect, useRef, useState } from 'react';

export function KeepCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Effect to handle clicking outside the card to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        if (isExpanded) {
          handleClose();
        }
      }
    }
    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cardRef, isExpanded]); // Re-run effect if these dependencies change

  if (!isExpanded) {
    return (
      <div
        onClick={handleExpand}
        className="w-full max-w-[600px] mx-auto p-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-md cursor-text"
      >
        <p className="text-zinc-500 dark:text-zinc-400">{`${note || 'Take a note...'}`}</p>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="w-full max-w-[600px] mx-auto p-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg flex flex-col"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full bg-transparent text-lg font-semibold outline-none mb-4 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
      />

      {/* Note Textarea */}
      <textarea
        ref={textareaRef}
        value={note}
        onInput={handleTextareaInput}
        placeholder="Take a note..."
        className="w-full bg-transparent outline-none resize-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
        rows={1} // Start with a single row
        autoFocus
      />

      {/* Toolbar and Close Button */}
      <div className="flex items-center justify-between mt-4">
        {/* Toolbar Icons */}
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

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

const ToolbarButton = ({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) => {
  return (
    <button className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors group relative">
      {children}
      <span className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 bg-zinc-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {tooltip}
      </span>
    </button>
  );
};
