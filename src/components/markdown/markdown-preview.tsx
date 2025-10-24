import { components } from '@/components/markdown/markdown-utils.tsx';
import MDEditor from '@uiw/react-md-editor';

type MarkdownPreviewProps = {
  md: string;
};

export const MarkdownPreview = ({ md }: MarkdownPreviewProps) => (
  <MDEditor.Markdown source={md} components={components} />
);
