import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import Link from '@tiptap/extension-link';
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import {
  MenuButtonBold,
  MenuButtonItalic,
  MenuButtonCode,
  MenuButtonCodeBlock,
  MenuButtonBulletedList,
  MenuButtonOrderedList,
  MenuButtonRedo,
  MenuButtonUndo,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  RichTextEditor,
  MenuButtonEditLink,
  MenuButtonTaskList,
  MenuButtonAlignCenter,
  MenuButtonAlignLeft,
  MenuButtonAlignRight,
  MenuButtonAddTable,
  TableBubbleMenu,
  TableImproved,
  LinkBubbleMenu,
  LinkBubbleMenuHandler,
  type RichTextEditorRef,
  RichTextEditorProvider,
} from "mui-tiptap";
import { useRef } from "react";
import { useEditor } from "@tiptap/react";
import { Editor as TiptapEditor } from "@tiptap/core";
import './styles.scss';

const extensions = [
  StarterKit,
  TableCell,
  TableHeader,
  TableRow,
  TaskList,
  TaskItem,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Link.configure({
    openOnClick: false,
  }),
  LinkBubbleMenuHandler,
  TableImproved.configure({
    resizable: true,
  }),
];

export function Editor({
  value,
  onChange,
  onUpdate,
  minHeight,
  maxHeight,
}: {
  value: string;
  onChange?: (_html: string) => void;
  onUpdate?: (_params: { editor: TiptapEditor }) => void;
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
      if (onChange) {
        onChange(html);
      }
      if (onUpdate) {
        onUpdate({ editor: rteRef.current.editor });
      }
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
          '& .ProseMirror': {
            minHeight: minHeight || '200px',
            maxHeight: maxHeight,
            overflowY: 'auto',
            overflowX: 'hidden',
          },
        }}
        renderControls={() => (
          <MenuControlsContainer>
            <MenuSelectHeading />
            <MenuDivider />
            <MenuButtonUndo />
            <MenuButtonRedo />
            <MenuDivider />
            <MenuButtonBold />
            <MenuButtonItalic />
            <MenuDivider />
            <MenuButtonCode />
            <MenuButtonCodeBlock />
            <MenuDivider />
            <MenuButtonBulletedList />
            <MenuButtonOrderedList />
            <MenuButtonTaskList />
            <MenuDivider />
            <MenuButtonAddTable />
            <MenuDivider />
            <MenuButtonAlignLeft />
            <MenuButtonAlignCenter />
            <MenuButtonAlignRight />
            <MenuDivider />
            <MenuButtonEditLink />
          </MenuControlsContainer>
        )}
      >
        {() => (
          <>
            <LinkBubbleMenu />
            <TableBubbleMenu />
          </>
        )}
      </RichTextEditor>
    </RichTextEditorProvider>
  );
}
