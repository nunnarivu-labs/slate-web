import { components } from '@/components/markdown/markdown-utils.tsx';
import MDEditor from '@uiw/react-md-editor';

type MarkdownEditorProps = {
  md: string;
  onChange: (md?: string) => void;
  autofocusEnd?: boolean;
  placeholder?: string;
};

export const MarkdownEditor = ({
  md,
  onChange,
  autofocusEnd = true,
  placeholder = '',
}: MarkdownEditorProps) => {
  return (
    <MDEditor
      preview="edit"
      value={md}
      onChange={onChange}
      autoFocusEnd={autofocusEnd}
      previewOptions={{
        components,
      }}
      textareaProps={{ placeholder }}
      className="w-full grow resize-none shadow-none"
    />
  );
};
