import { RefObject } from 'react';

type ContentEditorProps = {
  ref?: RefObject<HTMLTextAreaElement | null>;
  content: string;
  onChange: (md?: string) => void;
  autofocusEnd?: boolean;
  placeholder?: string;
};

export const ContentEditor = ({
  ref,
  content,
  onChange,
  placeholder = '',
}: ContentEditorProps) => (
  <textarea
    ref={ref}
    value={content}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    className="w-full flex-grow resize-none bg-transparent text-zinc-800 outline-none dark:text-zinc-200"
  />
);
