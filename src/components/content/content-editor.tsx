type ContentEditorProps = {
  content: string;
  onChange: (md?: string) => void;
  autofocusEnd?: boolean;
  placeholder?: string;
};

export const ContentEditor = ({
  content,
  onChange,
  autofocusEnd = true,
  placeholder = '',
}: ContentEditorProps) => (
  <textarea
    value={content}
    onChange={(event) => onChange(event.target.value)}
    autoFocus={autofocusEnd}
    placeholder={placeholder}
    className="w-full flex-grow resize-none bg-transparent text-zinc-800 outline-none dark:text-zinc-200"
  />
);
