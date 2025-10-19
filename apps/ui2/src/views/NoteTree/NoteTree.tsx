import { NavLink, Loader, Text, Group } from '@mantine/core';
import { useState } from 'react';
import { useTopLevelNotebooks } from '@/hooks';
import { IconPlus } from '@tabler/icons-react';
import { CreateNotebookModal } from './CreateNotebookModal';
import { NotebookNode } from './NotebookNode';

export function NoteTree() {
  const { data: topLevelNotebooks, isLoading, error } = useTopLevelNotebooks();
  const [createModalOpened, setCreateModalOpened] = useState(false);

  const createButton = (
    <NavLink
      label={
        <Group gap="xs">
          <IconPlus size={14} />
          <Text size="sm">Create Notebook</Text>
        </Group>
      }
      onClick={() => setCreateModalOpened(true)}
      style={{ fontStyle: 'italic' }}
    />
  );

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
          {createButton}
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
          {createButton}
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
    <>
      <NavLink label="Notebooks" childrenOffset={10}>
        {createButton}
        {topLevelNotebooks.map((notebook) => (
          <NotebookNode key={notebook.id} notebook={notebook} />
        ))}
      </NavLink>
      <CreateNotebookModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        parentId={null}
      />
    </>
  );
}
