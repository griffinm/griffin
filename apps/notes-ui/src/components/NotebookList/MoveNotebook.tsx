import { Input, Menu, MenuItem } from "@mui/material";
import { Notebook } from "@prisma/client";
import { useNotes } from "../../providers/NoteProvider/NoteProvider";
import { useMemo, useState } from "react";

interface Props {
  notebook: Notebook;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

export function MoveNotebook({
  notebook,
  anchorEl,
  onClose,
}: Props) {
  const { notebooks, updateNotebook, setCurrentNotebook } = useNotes();
  const [filterTerm, setFilterTerm] = useState('');

  const filteredNotebooks = useMemo(() => {
    let filtered = notebooks.filter((n) => n.id !== notebook.id);
    if (filterTerm) {
      filtered = filtered.filter((n) => n.title?.toLowerCase().includes(filterTerm.toLowerCase()));
    }
    return filtered;
  }, [notebooks, filterTerm]);


  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      <div className="p-2">
        <Input
          placeholder="Filter"
          autoFocus
          onChange={(e) => setFilterTerm(e.target.value)}
          value={filterTerm}
        />
        <div className=" max-h-[200px] overflow-y-auto mt-2">
          {filteredNotebooks.map((n) => (
            <MenuItem key={n.id} onClick={() => {
              onClose();
              updateNotebook({
                ...notebook,
                parentId: n.id,
              });
              setCurrentNotebook(notebook);
            }}>
              {n.title}
            </MenuItem>
          ))}
        </div>
      </div>
    </Menu>
  )
}
