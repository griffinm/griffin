import { Card, Text, Group, ActionIcon, HoverCard, Pill } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Note } from '@/types/note';
import { useNavigate } from 'react-router-dom';

interface RecentNoteCardProps {
  note: Note;
}

export function RecentNoteCard({ note }: RecentNoteCardProps) {
  const navigate = useNavigate();

  const contentPreview = note.content
    ? note.content.length > 100
      ? `${note.content.substring(0, 100)}...`
      : note.content
    : 'No content';

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the preview icon
    if ((e.target as HTMLElement).closest('[data-preview-icon]')) {
      return;
    }
    navigate(`/notes/${note.id}`);
  };

  return (
    <Card
      shadow="xs"
      padding="md"
      radius="md"
      withBorder
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      styles={{
        root: {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 'var(--mantine-shadow-md)',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
          },
        },
      }}
    >
      <Group justify="space-between" align="flex-start" mb="xs">
        <Text size="md" fw={600} lineClamp={1} style={{ flex: 1 }}>
          {note.title || 'Untitled Note'}
        </Text>
        <HoverCard width={400} shadow="md" openDelay={200}>
          <HoverCard.Target>
            <ActionIcon 
              variant="subtle" 
              size="sm"
              data-preview-icon
              onClick={(e) => e.stopPropagation()}
            >
              <IconEye size={16} />
            </ActionIcon>
          </HoverCard.Target>
          <HoverCard.Dropdown>
            <Text size="sm" fw={600} mb="xs">
              {note.title || 'Untitled Note'}
            </Text>
            <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
              {note.content || 'No content'}
            </Text>
          </HoverCard.Dropdown>
        </HoverCard>
      </Group>

      <Text size="sm" c="dimmed" lineClamp={2} mb="xs">
        {contentPreview}
      </Text>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <Group gap="xs" className="mb-2">
          {note.tags.map(tag => (
            <Pill key={tag.id} size="xs">
              {tag.name}
            </Pill>
          ))}
        </Group>
      )}

      <Text size="xs" c="dimmed">
        {formatDistanceToNowStrict(new Date(note.updatedAt), { addSuffix: true })}
      </Text>
    </Card>
  );
}

