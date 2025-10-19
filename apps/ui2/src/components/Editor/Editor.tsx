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
  MenuButtonAddImage,
  ResizableImage,
  insertImages,
  type RichTextEditorRef,
  RichTextEditorProvider,
} from "mui-tiptap";
import { useRef, useCallback } from "react";
import { useEditor } from "@tiptap/react";
import { Editor as TiptapEditor, type EditorOptions } from "@tiptap/core";
import { TaskExtension } from './plugins/Task/Extension';
import { TaskMenuItem } from './plugins/Task/MenuItem';
import { QuestionExtension } from './plugins/Question/Extension';
import { QuestionMenuItem } from './plugins/Question/MenuItem';
import { createMedia } from '@/api/mediaApi';
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
  ResizableImage,
  TaskExtension,
  QuestionExtension,
];

export function Editor({
  value,
  onChange,
  onUpdate,
  minHeight,
  maxHeight,
  noteId,
}: {
  value: string;
  onChange?: (_html: string) => void;
  onUpdate?: (_params: { editor: TiptapEditor }) => void;
  minHeight?: string | number;
  maxHeight?: string | number;
  noteId?: string;
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

  const fileListToImageFiles = (fileList: FileList): File[] => {
    return Array.from(fileList).filter((file) => {
      const mimeType = (file.type || "").toLowerCase();
      return mimeType.startsWith("image/");
    });
  };

  const handleNewImageFiles = useCallback(
    (files: File[], insertPosition?: number): void => {
      if (!rteRef.current?.editor || !noteId) {
        return;
      }

      const firstFile = files[0];
      
      // TODO: allow more than 1 file at a time
      createMedia({ file: firstFile, noteId })
        .then(media => {
          if (rteRef.current?.editor) {
            insertImages({
              images: [
                { src: media.publicUrl, alt: media.id }
              ],
              editor: rteRef.current.editor,
              position: insertPosition,
            });
          }
        })
        .catch(error => {
          console.error('Error uploading image:', error);
        });
    },
    [noteId],
  );

  const handlePaste: NonNullable<EditorOptions["editorProps"]["handlePaste"]> =
    useCallback(
      (_view, event, _slice) => {
        if (!event.clipboardData || !noteId) {
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
      [handleNewImageFiles, noteId],
    );
  
  const handleDrop: NonNullable<EditorOptions["editorProps"]["handleDrop"]> =
    useCallback(
      (view, event, _slice, _moved) => {
        if (!(event instanceof DragEvent) || !event.dataTransfer || !noteId) {
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
      [handleNewImageFiles, noteId],
    );

  return (
    <RichTextEditorProvider editor={editor}>
      <RichTextEditor
        ref={rteRef}
        onUpdate={handleUpdate}
        editorProps={noteId ? {
          handlePaste,
          handleDrop,
        } : undefined}
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
            <TaskMenuItem />
            <QuestionMenuItem />
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
            {noteId && (
              <>
                <MenuDivider />
                <MenuButtonAddImage
                  onClick={() => {
                    const url = window.prompt("Image URL");
          
                    if (url) {
                      editor?.chain().focus().setImage({ src: url }).run();
                    }
                  }}
                />
              </>
            )}
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
