import { NavLink, Loader, Text } from '@mantine/core';
import { useState } from 'react';
import { useTopLevelNotebooks, useNotebooksByParent } from '@/hooks';
import { Notebook } from '@/types';

interface NotebookNodeProps {
  notebook: Notebook;
  childrenOffset?: number;
}

function NotebookNode({ notebook, childrenOffset = 10 }: NotebookNodeProps) {
  const [opened, setOpened] = useState(false);
  
  // Only fetch children when the notebook is opened
  const { data: childNotebooks, isLoading } = useNotebooksByParent(notebook.id, opened);

  // Determine what to render inside
  let childContent;
  if (!opened) {
    // Render a hidden placeholder so chevron shows up
    childContent = <div style={{ display: 'none' }} />;
  } else if (isLoading) {
    childContent = <Text size="sm" c="dimmed">Loading...</Text>;
  } else if (childNotebooks && childNotebooks.length > 0) {
    childContent = childNotebooks.map((child) => (
      <NotebookNode key={child.id} notebook={child} childrenOffset={childrenOffset} />
    ));
  } else {
    childContent = <Text size="sm" c="dimmed">No child notebooks</Text>;
  }

  return (
    <NavLink
      href={`#notebook-${notebook.id}`}
      label={
        <span>
          {notebook.title}
          {opened && isLoading && <Loader size="xs" ml={8} />}
        </span>
      }
      childrenOffset={childrenOffset}
      opened={opened}
      onChange={setOpened}
    >
      {childContent}
    </NavLink>
  );
}

export function NoteTree() {
  const { data: topLevelNotebooks, isLoading, error } = useTopLevelNotebooks();

  if (isLoading) {
    return (
      <NavLink label="Notebooks" childrenOffset={10}>
        <Loader size="sm" />
      </NavLink>
    );
  }

  if (error) {
    return (
      <NavLink label="Notebooks" childrenOffset={10}>
        <Text size="sm" c="red">Error loading notebooks</Text>
      </NavLink>
    );
  }

  if (!topLevelNotebooks || topLevelNotebooks.length === 0) {
    return (
      <NavLink label="Notebooks" childrenOffset={10}>
        <Text size="sm" c="dimmed">No notebooks found</Text>
      </NavLink>
    );
  }

  return (
    <NavLink label="Notebooks" childrenOffset={10}>
      {topLevelNotebooks.map((notebook) => (
        <NotebookNode key={notebook.id} notebook={notebook} />
      ))}
    </NavLink>
  );
}
