import { X } from 'lucide-react';
import React, { useState } from 'react';

interface TagInputPopoverProps {
  onAddTag: (tag: string) => void;
  onClose: () => void;
}

export const TagInputPopover = ({
  onAddTag,
  onClose,
}: TagInputPopoverProps) => {
  const [tag, setTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tag.trim()) {
      onAddTag(tag.trim());
      setTag('');
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-full left-1/2 mb-2 w-64 max-w-[90vw] -translate-x-1/2 rounded-lg border bg-white p-3 shadow-xl md:right-auto md:left-auto md:w-64 md:translate-x-0 dark:border-zinc-600 dark:bg-zinc-700"
    >
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor="tag-input"
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
        >
          Add a tag
        </label>
        <button
          onClick={onClose}
          className="rounded-full p-1 hover:bg-zinc-200 dark:hover:bg-zinc-600"
        >
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          id="tag-input"
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="e.g., #work, #ideas"
          className="w-full flex-grow rounded-md bg-zinc-100 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800"
          autoFocus
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Add
        </button>
      </form>
    </div>
  );
};
