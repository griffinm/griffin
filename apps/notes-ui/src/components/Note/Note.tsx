import { useState, lazy } from "react";
import { ConfirmDialog } from "../ConfirmDialog";
import { Note as NoteType } from "@prisma/client"
import classNames from "classnames";

const Editor = lazy(() => import('./Editor').then(module => ({ default: module.Editor })));

interface NoteProps {
  note: NoteType;
  onDeleteNote: (noteId: string) => void;
  onUpdateNote: (note: NoteType) => void;
}

export function Note({ 
  note,
  onDeleteNote,
  onUpdateNote,
}: NoteProps) {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const containerClasses = classNames(
    "flex flex-col grow h-[100%]"
  );

  return (
    <div className={containerClasses}>
      <div className="flex flex-row grow">
        <div className="grow">
          <Editor
            note={note}
            onChange={(content) => onUpdateNote({ ...note, content })}
            isSaving={false}
          />
        </div>
      </div>
      <ConfirmDialog<NoteType>
        open={openDeleteDialog}
        onConfirm={(n) => onDeleteNote(n.id)}
        onClose={() => setOpenDeleteDialog(false)}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        data={note}
      />
    </div>
  );
}
