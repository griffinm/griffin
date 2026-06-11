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
import { useRef, useCallback, useMemo, useEffect, type MouseEvent } from "react";
import { useEditor } from "@tiptap/react";
import { Editor as TiptapEditor, type EditorOptions } from "@tiptap/core";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useComputedColorScheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { TaskExtension } from './plugins/Task/Extension';
import { TaskMenuItem } from './plugins/Task/MenuItem';
import { QuestionExtension } from './plugins/Question/Extension';
import { QuestionMenuItem } from './plugins/Question/MenuItem';
import { PromptExtension } from './plugins/Prompt/Extension';
import { PromptMenuItem } from './plugins/Prompt/MenuItem';
import { CollapsibleHeading } from './plugins/CollapsibleHeading/Extension';
import { NoteLinkExtension } from './plugins/NoteLink/Extension';
import { DropdownExtension } from './plugins/Dropdown/Extension';
import { DropdownMenuItem } from './plugins/Dropdown/MenuItem';
import { DataTableExtension } from './plugins/DataTable/Extension';
import { DataTableMenuItem } from './plugins/DataTable/MenuItem';
import { createMedia } from '@/api/mediaApi';
import { useOpenNote } from '@/hooks/useOpenNote';
import './styles.scss';

const baseExtensions = [
  StarterKit.configure({
    heading: false, // Disable default heading, use CollapsibleHeading instead
  }),
  CollapsibleHeading.configure({
    levels: [1, 2, 3, 4, 5, 6],
  }),
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
  PromptExtension,
  NoteLinkExtension,
];

export function Editor({
  value,
  onChange,
  onUpdate,
  minHeight,
  maxHeight,
  fillHeight,
  noteId,
}: {
  value: string;
  onChange?: (_html: string) => void;
  onUpdate?: (_params: { editor: TiptapEditor }) => void;
  minHeight?: string | number;
  maxHeight?: string | number;
  fillHeight?: boolean;
  noteId?: string;
}) {
  const rteRef = useRef<RichTextEditorRef>(null);
  const { openNote } = useOpenNote();
  const computedColorScheme = useComputedColorScheme('light');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const muiTheme = useMemo(
    () => createTheme({ palette: { mode: computedColorScheme } }),
    [computedColorScheme],
  );

  // Build the extension list per editor instance so the Dropdown and DataTable
  // plugins can be configured with this note's id (needed to create their
  // backing rows).
  const extensions = useMemo(
    () => [
      ...baseExtensions,
      DropdownExtension.configure({ noteId }),
      DataTableExtension.configure({ noteId }),
    ],
    [noteId],
  );

  const editor = useEditor({
    extensions: extensions,
    content: value || '',
  });

  // The editor is created once, so push the current noteId into the Dropdown
  // and DataTable plugins' storage whenever it changes (their NodeViews read
  // it from there to create their backing rows).
  useEffect(() => {
    if (editor?.storage?.dropdown) {
      editor.storage.dropdown.noteId = noteId;
    }
    if (editor?.storage?.dataTable) {
      editor.storage.dataTable.noteId = noteId;
    }
  }, [editor, noteId]);

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
  
  const handleClick: NonNullable<EditorOptions["editorProps"]["handleClick"]> =
    useCallback(
      (_view, _pos, event) => {
        const target = event.target as HTMLElement | null;
        const noteLinkEl = target?.closest('[data-type="noteLink"]') as HTMLElement | null;
        if (noteLinkEl) {
          const linkedNoteId = noteLinkEl.getAttribute('data-id');
          if (linkedNoteId) {
            openNote(linkedNoteId);
            return true;
          }
        }
        return false;
      },
      [openNote],
    );

  // Focus the editor when the user clicks in the empty area of the field (below
  // the content), not just on the editable content itself. Clicks on the content
  // or the toolbar keep their native behavior.
  const handleEditorAreaClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const activeEditor = rteRef.current?.editor;
      if (!activeEditor) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        !target ||
        // Ignore clicks that bubble in through React's tree from portaled UI
        // rendered inside the editor (e.g. a Mantine Select dropdown in the
        // Prompt node) — their DOM lives in document.body, not the field, so
        // they would otherwise trigger focus('end') and scroll to the bottom.
        !event.currentTarget.contains(target) ||
        target.closest('.ProseMirror') ||
        target.closest('.MuiTiptap-RichTextField-menuBar')
      ) {
        return;
      }
      activeEditor.commands.focus('end');
    },
    [],
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
    <ThemeProvider theme={muiTheme}>
    <RichTextEditorProvider editor={editor}>
      <RichTextEditor
        ref={rteRef}
        onUpdate={handleUpdate}
        editorProps={{
          handleClick,
          ...(noteId ? { handlePaste, handleDrop } : {}),
        }}
        extensions={extensions}
        content={value}
        RichTextFieldProps={{
          variant: "outlined",
          onClick: handleEditorAreaClick,
        }}
        sx={{
          ...(fillHeight && {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            cursor: 'text',
          }),
          '& .ProseMirror': {
            minHeight: fillHeight ? 0 : (minHeight || '200px'),
            ...(fillHeight && { flex: 1 }),
            maxHeight: maxHeight,
            overflowY: 'auto',
            overflowX: 'hidden',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: computedColorScheme === 'dark' ? 'transparent' : undefined,
          },
          ...(isMobile && {
            // On mobile, remove the editor's horizontal padding so content
            // runs right up to the screen edges and maximizes usable area.
            '& .MuiTiptap-RichTextField-content': {
              paddingLeft: '5px',
              paddingRight: '5px',
            },
          }),
        }}
        renderControls={() => (
          <MenuControlsContainer>
            <MenuSelectHeading />
            <MenuDivider />
            <MenuButtonUndo />
            <MenuButtonRedo />
            <MenuDivider />
            <TaskMenuItem />
            {noteId && <DropdownMenuItem noteId={noteId} />}
            {noteId && <DataTableMenuItem />}
            <QuestionMenuItem />
            <PromptMenuItem />
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
    </ThemeProvider>
  );
}
