import ReactMarkdown from 'react-markdown';

const markdownComponents = {
  p: ({ node, ...props }: any) => {
    return (
      <p
        className="text-sm break-words whitespace-pre-wrap text-zinc-700 dark:text-zinc-300"
        {...props}
      />
    );
  },

  li: ({ node, ...props }: any) => {
    return (
      <li
        className="text-sm break-words whitespace-pre-wrap text-zinc-700 dark:text-zinc-300"
        {...props}
      />
    );
  },

  strong: ({ node, ...props }: any) => {
    return (
      <strong
        className="text-sm break-words whitespace-pre-wrap text-zinc-700 dark:text-zinc-300"
        {...props}
      />
    );
  },
};

export const Markdown = ({ content }: { content: string }) => {
  return (
    <div style={{ whiteSpace: 'pre-wrap' }}>
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
};
