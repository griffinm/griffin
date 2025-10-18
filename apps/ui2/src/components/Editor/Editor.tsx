import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import Link from '@tiptap/extension-link';
import {
  MenuButtonBulletedList,
  MenuButtonOrderedList,
  MenuButtonRedo,
  MenuButtonUndo,
  MenuControlsContainer,
  MenuDivider,
  RichTextEditor,
  MenuButtonEditLink,
  MenuButtonTaskList,
  MenuButtonAlignCenter,
  MenuButtonAlignLeft,
  MenuButtonAlignRight,
  LinkBubbleMenu,
  LinkBubbleMenuHandler,
  type RichTextEditorRef,
  RichTextEditorProvider,
} from "mui-tiptap";
import { useRef } from "react";
import { useEditor } from "@tiptap/react";
import './styles.scss';

const extensions = [
  StarterKit,
  TaskList,
  TaskItem,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Link.configure({
    openOnClick: false,
  }),
  LinkBubbleMenuHandler,
];

export function Editor({
  value,
  onChange,
  minHeight,
  maxHeight,
}: {
  value: string;
  onChange: (_html: string) => void;
  minHeight?: string | number;
  maxHeight?: string | number;
}) {
  const rteRef = useRef<RichTextEditorRef>(null);
  
  const editor = useEditor({
    extensions: extensions,
    content: value || '',
  });

  const handleUpdate = () => {
    if (rteRef.current?.editor) {
      const html = rteRef.current.editor.getHTML();
      onChange(html);
    }
  };

  return (
    <RichTextEditorProvider editor={editor}>
      <RichTextEditor
        ref={rteRef}
        onUpdate={handleUpdate}
        extensions={extensions}
        content={value}
        RichTextFieldProps={{
          variant: "outlined",
        }}
        sx={{
          '.MuiOutlinedInput-root': {
            minHeight: minHeight,
            maxHeight: maxHeight,
          },
          '.ProseMirror': {
            minHeight: minHeight,
            maxHeight: maxHeight,
            overflowY: 'auto',
          },
        }}
        renderControls={() => (
          <MenuControlsContainer>
            <MenuButtonUndo />
            <MenuButtonRedo />
            <MenuDivider />
            <MenuButtonBulletedList />
            <MenuButtonOrderedList />
            <MenuButtonTaskList />
            <MenuDivider />
            <MenuButtonAlignLeft />
            <MenuButtonAlignCenter />
            <MenuButtonAlignRight />
            <MenuDivider />
            <MenuButtonEditLink />
          </MenuControlsContainer>
        )}
      >
        {() => <LinkBubbleMenu />}
      </RichTextEditor>
    </RichTextEditorProvider>
  );
}
