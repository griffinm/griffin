import { ActionIcon, Loader, Text, Tooltip } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import { useTopLevelNotebooks } from '@/hooks';
import { CreateNotebookModal } from './CreateNotebookModal';
import { NotebookNode } from './NotebookNode';

export function NoteTree() {
  const { data: topLevelNotebooks, isLoading, error } = useTopLevelNotebooks();
  const [createModalOpened, setCreateModalOpened] = useState(false);

  let body: ReactNode;
  if (isLoading) {
    body = (
      <div className="px-2.5 py-1.5">
        <Loader size="sm" />
      </div>
    );
  } else if (error) {
    body = (
      <Text size="sm" c="red" px="xs" py={4}>
        Error loading notebooks
      </Text>
    );
  } else if (!topLevelNotebooks || topLevelNotebooks.length === 0) {
    body = (
      <Text size="sm" c="dimmed" px="xs" py={4}>
        No notebooks yet
      </Text>
    );
  } else {
    body = topLevelNotebooks.map((notebook) => (
      <NotebookNode key={notebook.id} notebook={notebook} />
    ));
  }

  return (
    <>
      <div className="flex items-center justify-between px-2.5 pb-1 pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--mantine-color-dimmed)]">
          Notebooks
        </span>
        <Tooltip label="New notebook" openDelay={300} withArrow>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            onClick={() => setCreateModalOpened(true)}
            aria-label="New notebook"
          >
            <IconPlus size={15} stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      </div>

      <div className="flex flex-col">{body}</div>

      <CreateNotebookModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        parentId={null}
      />
    </>
  );
}
