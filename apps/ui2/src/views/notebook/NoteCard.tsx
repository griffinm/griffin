import { Card, Text, Group, Pill } from '@mantine/core';
import { formatDistanceToNowStrict } from 'date-fns';
import { Note } from '@/types/note';
import { getTagColors } from '@/utils/tagColors';
import { HtmlPreview } from '@/components/HtmlPreview';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

const MAX_VISIBLE_TAGS = 3;

// `self-start` keeps the card hugging its content instead of stretching to the
// tallest card in the SimpleGrid row — which is what previously left a large
// empty void inside short notes.
const HOVER_STYLES = {
  root: {
    transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--mantine-shadow-md)',
      borderColor: 'var(--mantine-color-teal-filled)',
    },
  },
};

export function NoteCard({ note, onClick }: NoteCardProps) {
  const visibleTags = note.tags?.slice(0, MAX_VISIBLE_TAGS) ?? [];
  const extraTags = (note.tags?.length ?? 0) - visibleTags.length;

  return (
    <Card
      shadow="xs"
      padding="md"
      radius="md"
      withBorder
      onClick={onClick}
      className="cursor-pointer self-start"
      styles={HOVER_STYLES}
    >
      <Text size="md" fw={600} lineClamp={2} className="leading-snug">
        {note.title || 'Untitled Note'}
      </Text>

      {note.preview && (
        <div className="mt-1.5">
          <HtmlPreview html={note.preview} maxHeight />
        </div>
      )}

      <Group justify="space-between" align="center" gap="xs" wrap="nowrap" mt="sm">
        <Text size="xs" c="dimmed" className="shrink-0">
          {formatDistanceToNowStrict(new Date(note.updatedAt), { addSuffix: true })}
        </Text>

        {visibleTags.length > 0 && (
          <Group gap={6} wrap="nowrap" className="min-w-0 justify-end overflow-hidden">
            {visibleTags.map((tag) => {
              const colors = getTagColors(tag.color);
              return (
                <Pill
                  key={tag.id}
                  size="xs"
                  style={{ backgroundColor: colors.bg, color: colors.text, flexShrink: 0 }}
                >
                  {tag.name}
                </Pill>
              );
            })}
            {extraTags > 0 && (
              <Text size="xs" c="dimmed" className="shrink-0">
                +{extraTags}
              </Text>
            )}
          </Group>
        )}
      </Group>
    </Card>
  );
}
