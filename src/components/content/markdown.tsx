import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

type MarkdownProps = {
  md: string;
  className?: string;
};

export const Markdown = ({ md, className }: MarkdownProps) => (
  <div
    className={`prose dark:prose-invert grow resize-none text-left ${className ?? ''}`}
  >
    <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
      {md}
    </ReactMarkdown>
  </div>
);
