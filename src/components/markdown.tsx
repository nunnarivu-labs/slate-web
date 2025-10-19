import ReactMarkdown from 'react-markdown';

const markdownComponents = {
  p: ({ node, ...props }: any) => {
    return (
      <p
        className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words"
        {...props}
      />
    );
  },

  li: ({ node, ...props }: any) => {
    return (
      <li
        className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words"
        {...props}
      />
    );
  },

  strong: ({ node, ...props }: any) => {
    return (
      <strong
        className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words"
        {...props}
      />
    );
  },
};

export const Markdown = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
  );
};
