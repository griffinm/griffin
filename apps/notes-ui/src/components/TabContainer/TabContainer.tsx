import { useEffect, useState } from "react";
import { useNotes } from "../../providers/NoteProvider";

export function TabContainer() {
  const [elementMap, setElementMap] = useState<Record<string, React.ReactNode>>({});
  const { openNotes } = useNotes();

  useEffect(() => {
    console.log(openNotes);
  }, [openNotes]);

  const addElement = (key: string, element: React.ReactNode) => {
    setElementMap((prev) => ({ ...prev, [key]: element }));
  };

  return (
    <div>
      <h1>TabContainer</h1>

    </div>
  );
}
