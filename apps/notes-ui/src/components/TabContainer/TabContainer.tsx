import { useState } from "react";

export function TabContainer() {
  const [elementMap, setElementMap] = useState<Record<string, React.ReactNode>>({});

  const addElement = (key: string, element: React.ReactNode) => {
    setElementMap((prev) => ({ ...prev, [key]: element }));
  };

  return (
    <div>
      <h1>TabContainer</h1>
    </div>
  );
}
