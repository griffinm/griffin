import { Card, Text, Group } from '@mantine/core';
import { formatDistanceToNowStrict } from 'date-fns';
import { Note } from '@/types/note';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  // Content is already pre-processed and truncated by the server
  // Additional client-side truncation for display consistency
  const contentPreview = note.content
    ? note.content.length > 200
      ? `${note.content.substring(0, 200)}...`
      : note.content
    : '';

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] h-full flex flex-col"
      onClick={onClick}
    >
      <div className="flex-1">
        <Text size="lg" fw={600} mb="sm" lineClamp={2}>
          {note.title || 'Untitled Note'}
        </Text>

        {contentPreview && (
          <Text size="sm" c="dimmed" lineClamp={4} className="mb-4">
            {contentPreview}
          </Text>
        )}
      </div>

      <Group justify="space-between" mt="auto" pt="md">
        <Text size="xs" c="dimmed">
          {formatDistanceToNowStrict(new Date(note.updatedAt), { addSuffix: true })}
        </Text>
      </Group>
    </Card>
  );
}

