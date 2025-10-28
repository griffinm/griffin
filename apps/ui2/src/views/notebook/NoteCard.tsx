import { Card, Text, Group, Pill } from '@mantine/core';
import { formatDistanceToNowStrict } from 'date-fns';
import { Note } from '@/types/note';
import { getTagColors } from '@/utils/tagColors';
import { HtmlPreview } from '@/components/HtmlPreview';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
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

        {note.content && (
          <div className="mb-4">
            <HtmlPreview html={note.content} maxHeight={true} />
          </div>
        )}
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <Group gap="xs" className="mb-2">
          {note.tags.map(tag => {
            const colors = getTagColors(tag.color);
            return (
              <Pill 
                key={tag.id} 
                size="xs"
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                }}
              >
                {tag.name}
              </Pill>
            );
          })}
        </Group>
      )}

      <Group justify="space-between" mt="auto" pt="md">
        <Text size="xs" c="dimmed">
          {formatDistanceToNowStrict(new Date(note.updatedAt), { addSuffix: true })}
        </Text>
      </Group>
    </Card>
  );
}

