import { useTheme } from '@/hooks/use-theme.ts';
import {
  BoldItalicUnderlineToggles,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  MDXEditorMethods,
  UndoRedo,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from '@mdxeditor/editor';
import { RefObject } from 'react';

type MarkdownEditorProps = {
  ref: RefObject<MDXEditorMethods | null>;
  md: string;
  onChange: (md: string) => void;
  readonly?: boolean;
};

export const MarkdownEditor = ({
  ref,
  md,
  onChange,
  readonly = false,
}: MarkdownEditorProps) => {
  const theme = useTheme();

  return (
    <MDXEditor
      readOnly={readonly}
      ref={ref}
      markdown={md}
      onChange={onChange}
      className={`${theme === 'dark' ? 'dark-theme' : ''}`}
      contentEditableClassName={`prose ${theme === 'dark' ? 'dark-theme' : ''}`}
      plugins={[
        listsPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <ListsToggle options={['bullet', 'number']} />
              <InsertThematicBreak />
            </>
          ),
        }),
        thematicBreakPlugin(),
        linkPlugin(),
        markdownShortcutPlugin(),
      ]}
      placeholder="Take a note..."
    />
  );
};
