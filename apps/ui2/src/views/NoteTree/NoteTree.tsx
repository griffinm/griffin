import { NavLink, Loader, Text, Modal, TextInput, Textarea, Button, Group } from '@mantine/core';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTopLevelNotebooks, useNotebooksByParent, useCreateNotebook } from '@/hooks';
import { Notebook } from '@/types';
import { getUrl } from '@/constants/urls';
import { IconPlus } from '@tabler/icons-react';

interface CreateNotebookModalProps {
  opened: boolean;
  onClose: () => void;
  parentId?: string | null;
}

function CreateNotebookModal({ opened, onClose, parentId }: CreateNotebookModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const createNotebook = useCreateNotebook();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createNotebook.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        parentId: parentId || null,
      });
      
      // Reset form and close modal
      setTitle('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating notebook:', error);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Create A New Notebook">
      <form onSubmit={handleSubmit}>
        <TextInput
          autoFocus
          placeholder="Notebook title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          mb="md"
        />
        <Textarea
          placeholder="Notebook description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          mb="md"
          rows={4}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={createNotebook.isPending}>
            Create
          </Button>
        </Group>
      </form>
    </Modal>
  );
}

interface NotebookNodeProps {
  notebook: Notebook;
  childrenOffset?: number;
}

function NotebookNode({ notebook, childrenOffset = 10 }: NotebookNodeProps) {
  const [opened, setOpened] = useState(false);
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Only fetch children when the notebook is opened
  const { data: childNotebooks, isLoading } = useNotebooksByParent(notebook.id, opened);

  // Check if this notebook is currently active
  const notebookPath = getUrl('notebook').path(notebook.id);
  const isActive = location.pathname === notebookPath;

  // Handle clicking on the notebook label to navigate
  const handleClick = () => {
    navigate(notebookPath);
  };

  // Determine what to render inside
  let childContent;
  if (!opened) {
    // Render a hidden placeholder so chevron shows up
    childContent = <div style={{ display: 'none' }} />;
  } else if (isLoading) {
    childContent = <Text size="sm" c="dimmed">Loading...</Text>;
  } else {
    // When expanded, show the create button at the top
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

    if (childNotebooks && childNotebooks.length > 0) {
      childContent = (
        <>
          {createButton}
          {childNotebooks.map((child) => (
            <NotebookNode key={child.id} notebook={child} childrenOffset={childrenOffset} />
          ))}
        </>
      );
    } else {
      childContent = (
        <>
          {createButton}
          <Text size="sm" c="dimmed">No child notebooks</Text>
        </>
      );
    }
  }

  return (
    <>
      <NavLink
        label={
          <span onClick={handleClick} style={{ cursor: 'pointer' }}>
            {notebook.title}
            {opened && isLoading && <Loader size="xs" ml={8} />}
          </span>
        }
        childrenOffset={childrenOffset}
        opened={opened}
        onChange={setOpened}
        active={isActive}
      >
        {childContent}
      </NavLink>
      <CreateNotebookModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        parentId={notebook.id}
      />
    </>
  );
}

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
