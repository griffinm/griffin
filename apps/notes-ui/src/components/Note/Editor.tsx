import { Note } from "@prisma/client";

import StarterKit from "@tiptap/starter-kit";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import {
  MenuButtonAddTable,
  MenuButtonBold,
  MenuButtonBulletedList,
  MenuButtonCode,
  MenuButtonCodeBlock,
  MenuButtonHorizontalRule,
  MenuButtonItalic,
  MenuButtonOrderedList,
  MenuButtonRedo,
  MenuButtonUndo,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  RichTextEditorProvider,
  RichTextField,
  TableBubbleMenu,
  TableImproved,
  RichTextEditor,
  type RichTextEditorRef,
} from "mui-tiptap";
import { useCallback, useRef, useState } from "react";
import { Editor as TiptapEditor } from "@tiptap/core";

interface Props {
  note: Note,
  onChange: (content: string) => void,
  isSaving: boolean,
}

const extensions = [
  StarterKit,
  TableCell,
  TableHeader,
  TableRow,
  TableImproved.configure({
    resizable: true,
  }),
]

const SAVE_TIMEOUT = 1500;
const MAX_SAVE_INTERVAL = 10_000;

export function Editor({ 
  note,
  onChange,
  isSaving,
}: Props) {
  const rteRef = useRef<RichTextEditorRef>(null);
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  updateTimeoutRef.current = updateTimeout;
  const [lastSaveAt, setLastSaveAt] = useState<Date | null>(null);
  const lastSaveAtRef = useRef<Date | null>(null);
  lastSaveAtRef.current = lastSaveAt;

  const handleUpdate = ({ editor }: { editor: TiptapEditor }) => {
    setLastSaveAt(new Date());
    onChange(editor.getHTML());
  }
  
  const debouncedUpdate = useCallback(() => {
    if (isSaving) {
      return;
    }

    // At a min save every MAX_SAVE_INTERVAL
    const timeSinceLastSaved = new Date().getTime() - (lastSaveAtRef.current ? lastSaveAtRef.current.getTime() : 0);
    if (timeSinceLastSaved > MAX_SAVE_INTERVAL) {
      handleUpdate({ editor: rteRef!.current!.editor! });
      setLastSaveAt(new Date());
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

  return (
    <RichTextEditor
      onUpdate={debouncedUpdate}
      ref={rteRef}
      extensions={extensions}
      content={note.content}
      renderControls={() => (
        <MenuControlsContainer>
          <MenuSelectHeading />
          <MenuDivider />
          <MenuButtonBold />
          <MenuButtonItalic />
          <MenuButtonAddTable />
        </MenuControlsContainer>
      )}
    >
      {() => (
        <>
          <TableBubbleMenu />
        </>
      )}
    </RichTextEditor>
  )
}
