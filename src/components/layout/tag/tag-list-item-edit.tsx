import { Tag } from '@/types/tag.ts';
import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from 'convex/react';
import { X } from 'lucide-react';
import { ChangeEvent, FormEvent, KeyboardEvent, useState } from 'react';

import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

type TagListItemEditProps = {
  tag: Tag;
  onEditDone: () => void;
};

export const TagListItemEdit = ({ tag, onEditDone }: TagListItemEditProps) => {
  const allTagsQuery = useQuery(convexQuery(api.tasks.fetchAllTags, {}));

  const editTagNameMutation = useMutation(api.tasks.editTagName);

  const [tagName, setTagName] = useState(tag.name);
  const [isError, setIsError] = useState(false);

  const otherClasses = isError
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-600 placeholder:text-red-400'
    : 'border-transparent focus:border-blue-500 focus:ring-blue-500';

  const validateAndSubmit = async () => {
    const newName = tagName.trim();

    if (newName === tag.name) {
      onEditDone();
    } else {
      if (
        newName &&
        allTagsQuery.isSuccess &&
        !allTagsQuery.data.map((t) => t.name).includes(newName)
      ) {
        await editTagNameMutation({ id: tag.id as Id<'tags'>, newName });
        onEditDone();
      } else {
        setIsError(true);
      }
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await validateAndSubmit();
  };

  const onBlur = async () => await validateAndSubmit();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTagName(e.target.value);
    if (isError) setIsError(false);
  };

  const onKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await validateAndSubmit();
    } else if (e.key === 'Escape') {
      onEditDone();
    }
  };

  return (
    <form onSubmit={onSubmit} className="relative flex-grow">
      <input
        type="text"
        value={tagName}
        onKeyDown={onKeyDown}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full border-b-2 bg-transparent pr-8 text-zinc-800 transition-colors outline-none dark:text-zinc-200 ${otherClasses}`}
        autoFocus
      />
      {tagName && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onEditDone}
          className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-1 text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
          title="Clear input"
        >
          <X size={16} />
        </button>
      )}
    </form>
  );
};
