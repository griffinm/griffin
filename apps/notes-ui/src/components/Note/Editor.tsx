import { Note } from "@prisma/client";

import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import Link from '@tiptap/extension-link'
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import type { EditorOptions } from "@tiptap/core";
import {
  MenuButtonAddTable,
  MenuButtonBold,
  MenuButtonBulletedList,
  MenuButtonCode,
  MenuButtonCodeBlock,
  MenuButtonItalic,
  MenuButtonOrderedList,
  MenuButtonRedo,
  MenuButtonUndo,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  TableBubbleMenu,
  TableImproved,
  RichTextEditor,
  MenuButtonEditLink,
  MenuButtonTaskList,
  MenuButtonAlignCenter,
  MenuButtonAlignLeft,
  MenuButtonAlignRight,
  LinkBubbleMenu,
  LinkBubbleMenuHandler,
  MenuButtonAddImage,
  ResizableImage,
  type RichTextEditorRef,
  RichTextEditorProvider,
  insertImages
} from "mui-tiptap";
import { TaskMenuItem } from "./plugins/Task/MenuItem";
import { useCallback, useRef, useState } from "react";
import { Editor as TiptapEditor } from "@tiptap/core";
import { useEditor } from "@tiptap/react";
import { createMedia } from "../../utils/api";
import { TaskExtension } from "./plugins/Task/Extension";
import { QuestionExtension } from "./plugins/Question/Extension";
import { TitleBarExtension } from "./plugins/TitleBar/Extension";

interface Props {
  note: Note,
  onChange: (content: string) => void,
  isSaving: boolean,
}

const extensions = [
  TitleBarExtension,
  StarterKit,
  TableCell,
  TableHeader,
  TableRow,
  TaskList,
  TaskItem,
  TextAlign,
  Link,
  ResizableImage,
  LinkBubbleMenuHandler,
  TableImproved.configure({
    resizable: true,
  }),
  TaskExtension,
  QuestionExtension,
]

const SAVE_TIMEOUT = 1000;

export function Editor({ 
  note,
  onChange,
  isSaving,
}: Props) {
  const rteRef = useRef<RichTextEditorRef>(null);
  const [updateTimeout] = useState<NodeJS.Timeout | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  updateTimeoutRef.current = updateTimeout;
  const [lastSaveAt, setLastSaveAt] = useState<Date | null>(null);
  const lastSaveAtRef = useRef<Date | null>(null);
  lastSaveAtRef.current = lastSaveAt;
  const editor = useEditor({
    extensions: extensions,
    content: note.content,
  });

  const handleUpdate = ({ editor }: { editor: TiptapEditor }) => {
    setLastSaveAt(new Date());
    onChange(editor.getHTML());
  }
  
  const debouncedUpdate = useCallback(() => {
    if (isSaving) {
      return;
    }

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      if (rteRef.current?.editor) {
        handleUpdate({ editor: rteRef.current.editor });
      }
    }, SAVE_TIMEOUT);
  }, [])
  
  const fileListToImageFiles = (fileList: FileList): File[] => {
    return Array.from(fileList).filter((file) => {
      const mimeType = (file.type || "").toLowerCase();
      return mimeType.startsWith("image/");
    });
  }

  const handleNewImageFiles = useCallback(
    (files: File[], insertPosition?: number): void => {
      if (!rteRef.current?.editor) {
        return;
      }

      const firstFile = files[0]
      
      // TODO: allow more than 1 file at a time
      createMedia({ file: firstFile, noteId: note.id})
        .then(resp => {
          insertImages({
            images: [
              { src: resp.data.publicUrl, alt: resp.data.id }
            ],
            editor: rteRef!.current!.editor,
            position: insertPosition,
          });
        })
    },
    [],
  );

  const handlePaste: NonNullable<EditorOptions["editorProps"]["handlePaste"]> =
    useCallback(
      (_view, event, _slice) => {
        if (!event.clipboardData) {
          return false;
        }

        const pastedImageFiles = fileListToImageFiles(
          event.clipboardData.files,
        );
        if (pastedImageFiles.length > 0) {
          handleNewImageFiles(pastedImageFiles);
          return true;
        }

        return false;
      },
      [handleNewImageFiles],
    );
  
  const handleDrop: NonNullable<EditorOptions["editorProps"]["handleDrop"]> =
    useCallback(
      (view, event, _slice, _moved) => {
        if (!(event instanceof DragEvent) || !event.dataTransfer) {
          return false;
        }

        const imageFiles = fileListToImageFiles(event.dataTransfer.files);
        if (imageFiles.length > 0) {
          const insertPosition = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          })?.pos;

          handleNewImageFiles(imageFiles, insertPosition);
          event.preventDefault();
          return true;
        }

        return false;
      },
      [handleNewImageFiles],
    );

  return (
    <RichTextEditorProvider editor={editor}>
      <RichTextEditor
        onUpdate={debouncedUpdate}
        editorProps={{
          handlePaste,
          handleDrop,
        }}
        RichTextFieldProps={{
          variant: "outlined",
        }}
        ref={rteRef}
        onTransaction={(transaction) => {
          const content = transaction.editor.getHTML();
          if (!content.includes('<title-bar>')) {
            transaction.editor.commands.insertContentAt(0, '<title-bar></title-bar>');
          }
        }}
        extensions={extensions}
        content={note.content}
        renderControls={() => (
          <MenuControlsContainer>
            <MenuSelectHeading />
            <MenuDivider />
            <MenuButtonUndo />
            <MenuButtonRedo />
            <MenuDivider />
            <TaskMenuItem />
            <MenuDivider />
            <MenuButtonBulletedList />
            <MenuButtonOrderedList />
            <MenuButtonTaskList />
            <MenuDivider />
            <MenuButtonBold />
            <MenuButtonItalic />
            <MenuDivider />
            <MenuButtonCode />
            <MenuButtonCodeBlock />
            <MenuDivider />
            <MenuButtonAddTable />
            <MenuDivider />
            <MenuButtonAlignLeft />
            <MenuButtonAlignCenter />
            <MenuButtonAlignRight />
            <MenuDivider />
            <MenuButtonEditLink />
            <MenuDivider />
            <MenuButtonAddImage
              onClick={() => {
                const url = window.prompt("Image URL");
      
                if (url) {
                  editor?.chain().focus().setImage({ src: url }).run();
                }
              }}
            />
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
  )
}
