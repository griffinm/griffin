import { Notebook } from "@prisma/client"
import { 
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import React, { useState } from "react";
import { NotebookTitle } from "./NotebookTitle";
import { findChildrenForParent } from "./utils";
import { useNotes } from "../../providers/NoteProvider/NoteProvider";

interface Props {
  notebook: Notebook;
  showNotebookDeleteDialog: (notebook: Notebook) => void;
  allNotebooks: Notebook[];
}

export function NotebookListItem({
  notebook,
  showNotebookDeleteDialog,
  allNotebooks,
}: Props) {
  const children = findChildrenForParent(notebook, allNotebooks);
  const [expanded, setExpanded] = useState(false);
  const { currentNotebook } = useNotes();
  const isParentCurrent = currentNotebook?.id === notebook.id;

  return (
    <>
      <ListItemButton
        key={notebook.id}
        onClick={() => setExpanded(!expanded)}
        sx={{
          backgroundColor: isParentCurrent ? 'rgb(38, 50, 69)' : 'inherit',
          pl: 4,
          py: '1px',
        }}
      >
        <NotebookTitle
          notebook={notebook}
          onDeleteNotebook={showNotebookDeleteDialog}
        />
      </ListItemButton>
      {children.length > 0 && (
        <Collapse in={expanded} unmountOnExit timeout="auto">
          <List component="div">
            {children.map((child) => {
              const isChildCurrent = currentNotebook?.id === child.id;
              return (
                <ListItemButton
                  key={child.id}
                  sx={{
                    pl: 6,
                    py: '1px',
                    backgroundColor: isChildCurrent ? 'rgb(38, 50, 69)' : 'inherit',
                  }}
                >
                  <NotebookTitle
                    notebook={child}
                    onDeleteNotebook={showNotebookDeleteDialog}
                  />
                </ListItemButton>
              )
            })}
          </List>
        </Collapse>
      )}
    </>
  )
}
