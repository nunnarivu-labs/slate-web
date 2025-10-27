type MarkdownPreviewProps = {
  md: string;
};

export const MarkdownPreview = ({ md }: MarkdownPreviewProps) => (
  <p className="text-zinc-800 dark:text-zinc-200">{md}</p>
);
