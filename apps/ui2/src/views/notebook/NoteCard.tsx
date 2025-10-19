import { Card, Text, Group } from '@mantine/core';
import { formatDistanceToNowStrict } from 'date-fns';
import { Note } from '@/types/note';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  // Create a preview of the content (first 150 characters)
  const contentPreview = note.content
    ? note.content.length > 150
      ? `${note.content.substring(0, 150)}...`
      : note.content
    : '';

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <Text size="lg" fw={600} mb="xs">
        {note.title || 'Untitled Note'}
      </Text>

      {contentPreview && (
        <Text size="sm" c="dimmed" mb="md" lineClamp={3}>
          {contentPreview}
        </Text>
      )}

      <Group justify="space-between" mt="md">
        <Text size="xs" c="dimmed">
          Updated {formatDistanceToNowStrict(new Date(note.updatedAt), { addSuffix: true })}
        </Text>
      </Group>
    </Card>
  );
}

