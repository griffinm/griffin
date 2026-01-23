import { NavLink, Loader, Text, Group } from '@mantine/core';
import { useState } from 'react';
import { useTopLevelNotebooks } from '@/hooks';
import { CreateNotebookModal } from './CreateNotebookModal';
import { NotebookNode } from './NotebookNode';

export function NoteTree() {
  const { data: topLevelNotebooks, isLoading, error } = useTopLevelNotebooks();
  const [createModalOpened, setCreateModalOpened] = useState(false);

  if (isLoading) {
    return (
      <>
        <NavLink label="Notebooks" childrenOffset={10}>
          <Loader size="sm" />
        </NavLink>
        <CreateNotebookModal
          opened={createModalOpened}
          onClose={() => setCreateModalOpened(false)}
          parentId={null}
        />
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavLink label="Notebooks" childrenOffset={10}>
          <Text size="sm" c="red">Error loading notebooks</Text>
        </NavLink>
        <CreateNotebookModal
          opened={createModalOpened}
          onClose={() => setCreateModalOpened(false)}
          parentId={null}
        />
      </>
    );
  }

  if (!topLevelNotebooks || topLevelNotebooks.length === 0) {
    return (
      <>
        <NavLink label="Notebooks" childrenOffset={10}>
          <Text size="sm" c="dimmed">No notebooks found</Text>
        </NavLink>
        <CreateNotebookModal
          opened={createModalOpened}
          onClose={() => setCreateModalOpened(false)}
          parentId={null}
        />
      </>
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
