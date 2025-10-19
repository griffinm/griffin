import { NavLink, Loader, Text, Group, Menu, ActionIcon, useMantineTheme } from '@mantine/core';
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotebooksByParent, useDeleteNotebook, useUpdateNotebook } from '@/hooks';
import { Notebook } from '@/types';
import { getUrl } from '@/constants/urls';
import { IconPlus, IconDots, IconTrash, IconEdit } from '@tabler/icons-react';
import { CreateNotebookModal } from './CreateNotebookModal';
import { ConfirmationModal } from './ConfirmationModal';

interface NotebookNodeProps {
  notebook: Notebook;
  childrenOffset?: number;
}

export function NotebookNode({ notebook, childrenOffset = 10 }: NotebookNodeProps) {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(notebook.title);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const deleteNotebook = useDeleteNotebook();
  const updateNotebook = useUpdateNotebook();
  
  // Only fetch children when the notebook is opened
  const { data: childNotebooks, isLoading } = useNotebooksByParent(notebook.id, opened);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync editValue when notebook title changes
  useEffect(() => {
    setEditValue(notebook.title);
  }, [notebook.title]);

  // Check if this notebook is currently active
  const notebookPath = getUrl('notebook').path(notebook.id);
  const isActive = location.pathname === notebookPath;

  // Handle clicking on the notebook label to navigate
  const handleClick = () => {
    navigate(notebookPath);
  };

  // Handle deleting the notebook
  const handleDelete = async () => {
    try {
      await deleteNotebook.mutateAsync(notebook.id);
      setDeleteModalOpened(false);
      // If we're currently viewing this notebook, navigate away
      if (isActive) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error deleting notebook:', error);
    }
  };

  // Handle starting rename
  const handleStartRename = () => {
    setEditValue(notebook.title);
    setIsEditing(true);
  };

  // Handle saving rename
  const handleSaveRename = async () => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue || trimmedValue === notebook.title) {
      setIsEditing(false);
      setEditValue(notebook.title);
      return;
    }

    try {
      await updateNotebook.mutateAsync({
        id: notebook.id,
        notebook: {
          title: trimmedValue,
          description: notebook.description,
          parentId: notebook.parentId,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error renaming notebook:', error);
      setEditValue(notebook.title);
      setIsEditing(false);
    }
  };

  // Handle canceling rename
  const handleCancelRename = () => {
    setEditValue(notebook.title);
    setIsEditing(false);
  };

  // Handle key press in edit input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelRename();
    }
  };

  // Determine what to render inside
  let childContent;
  if (!opened) {
    // Render a hidden placeholder so chevron shows up
    childContent = <div style={{ display: 'none' }} />;
  } else if (isLoading) {
    childContent = <Text size="sm" c="dimmed">Loading...</Text>;
  } else if (childNotebooks && childNotebooks.length > 0) {
    childContent = (
      <>
        {childNotebooks.map((child) => (
          <NotebookNode key={child.id} notebook={child} childrenOffset={childrenOffset} />
        ))}
      </>
    );
  }

  return (
    <>
      <NavLink
        label={
          <div style={{ position: 'relative', width: '100%' }}>
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            ) : (
              <span onClick={handleClick} style={{ cursor: 'pointer', display: 'block' }}>
                {notebook.title}
                {opened && isLoading && <Loader size="xs" ml={8} />}
              </span>
            )}
            {isHovered && (
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                right: 0, 
                transform: 'translateY(-50%)', 
                zIndex: 10,
                background: theme.colors.gray[0],
                backdropFilter: 'blur(8px)',
                borderRadius: '4px',
                padding: '2px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <Menu shadow="md" width={200} position="right-start">
                  <Menu.Target>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconDots size={14} color="gray" />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconPlus size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCreateModalOpened(true);
                      }}
                    >
                      Create Notebook
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconEdit size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename();
                      }}
                    >
                      Rename
                    </Menu.Item>
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModalOpened(true);
                      }}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </div>
            )}
          </div>
        }
        childrenOffset={childrenOffset}
        opened={opened}
        onChange={setOpened}
        active={isActive}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {childContent}
      </NavLink>
      <CreateNotebookModal
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        parentId={notebook.id}
      />
      <ConfirmationModal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        onConfirm={handleDelete}
        title="Delete Notebook"
        message={`Are you sure you want to delete "${notebook.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteNotebook.isPending}
      />
    </>
  );
}

