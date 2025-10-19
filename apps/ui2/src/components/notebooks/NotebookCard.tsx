import { Card, Text, Group, Badge, ActionIcon, Menu } from '@mantine/core';
import { IconBook, IconDotsVertical, IconEdit, IconTrash, IconNotes } from '@tabler/icons-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Notebook } from '@/types/notebook';
import { useNavigate } from 'react-router-dom';

interface NotebookCardProps {
  notebook: Notebook;
  notesCount?: number;
  onEdit?: (_notebook: Notebook) => void;
  onDelete?: (_notebook: Notebook) => void;
}

export function NotebookCard({ notebook, notesCount, onEdit, onDelete }: NotebookCardProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the menu
    if ((e.target as HTMLElement).closest('[data-menu]')) {
      return;
    }
    navigate(`/notebooks/${notebook.id}`);
  };

  return (
    <Card
      shadow="xs"
      padding="md"
      radius="md"
      withBorder
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={handleClick}
    >
      <Group justify="space-between" align="flex-start" mb="xs">
        <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <IconBook 
            size={20} 
            style={{ 
              color: 'var(--mantine-color-blue-6)',
              flexShrink: 0 
            }} 
          />
          <Text size="md" fw={600} lineClamp={1} style={{ flex: 1 }}>
            {notebook.title || 'Untitled Notebook'}
          </Text>
        </Group>
        {(onEdit || onDelete) && (
          <Menu position="bottom-end" shadow="md" data-menu>
            <Menu.Target>
              <ActionIcon 
                variant="subtle" 
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {onEdit && (
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(notebook);
                  }}
                >
                  Edit
                </Menu.Item>
              )}
              {onDelete && (
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notebook);
                  }}
                >
                  Delete
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      {notebook.description && (
        <Text size="sm" c="dimmed" lineClamp={2} mb="xs">
          {notebook.description}
        </Text>
      )}

      <Group justify="space-between" mt="md">
        {notesCount !== undefined && (
          <Group gap="xs">
            <IconNotes size={14} style={{ color: 'var(--mantine-color-gray-6)' }} />
            <Text size="xs" c="dimmed">
              {notesCount} {notesCount === 1 ? 'note' : 'notes'}
            </Text>
          </Group>
        )}
        <Text size="xs" c="dimmed">
          Updated {formatDistanceToNowStrict(new Date(notebook.updatedAt), { addSuffix: true })}
        </Text>
      </Group>

      {notebook.isDefault && (
        <Badge size="xs" color="blue" variant="light" mt="xs">
          Default
        </Badge>
      )}
    </Card>
  );
}

