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

  return (
    <>
      <ListItemButton key={notebook.id} onClick={() => setExpanded(!expanded)}>
        <NotebookTitle
          notebook={notebook}
          onDeleteNotebook={showNotebookDeleteDialog}
        />
      </ListItemButton>
      {children.length > 0 && (
        <Collapse in={expanded} unmountOnExit timeout="auto">
          <List component="div">
            {children.map((child) => (
              <ListItemButton key={child.id} sx={{ pl: 4 }}>
                <NotebookTitle
                  notebook={child}
                  onDeleteNotebook={showNotebookDeleteDialog}
                />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      )}
    </>
  )
}
