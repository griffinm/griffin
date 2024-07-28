import { Notebook } from "@prisma/client";
import { useEffect, useState } from "react";
import { fetchNotebooks, updateNotebook } from "../../utils/api";
import { List } from "./List";

export function NotebookList() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);

  useEffect(() => {
    fetchNotebooks().then((resp) => {
      setNotebooks(resp.data)
    })
  }, []);

  const onUpdateNotebook = (notebook: Notebook) => {
    updateNotebook(notebook.id, notebook)
      .then((resp) => {
        setNotebooks(notebooks.map((nb) => nb.id === notebook.id ? notebook : nb))
      })
  }

  return (
    <div>
      <List
        notebooks={notebooks}
        onUpdateNotebook={onUpdateNotebook}
      />
    </div>
  );
}
