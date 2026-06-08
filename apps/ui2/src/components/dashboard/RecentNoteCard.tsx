import { useState } from 'react';
import { Card, Text, Group, ActionIcon, HoverCard, Pill } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Note } from '@/types/note';
import { useOpenNote } from '@/hooks/useOpenNote';
import { useNote } from '@/hooks/useNotes';
import { getTagColors } from '@/utils/tagColors';
import { HtmlPreview } from '@/components/HtmlPreview';

interface RecentNoteCardProps {
  note: Note;
}

const MAX_VISIBLE_TAGS = 3;

// `self-start` keeps the card hugging its content instead of stretching to the
// tallest card in the SimpleGrid row.
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

export function RecentNoteCard({ note }: RecentNoteCardProps) {
  const { openNote } = useOpenNote();

  // Lazily load the full note content only when the preview popover opens, so list
  // views still avoid paying for full content up front.
  const [previewOpened, setPreviewOpened] = useState(false);
  const { data: fullNote, isLoading } = useNote(note.id, { enabled: previewOpened });

  const visibleTags = note.tags?.slice(0, MAX_VISIBLE_TAGS) ?? [];
  const extraTags = (note.tags?.length ?? 0) - visibleTags.length;

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the preview icon
    if ((e.target as HTMLElement).closest('[data-preview-icon]')) {
      return;
    }
    openNote(note.id, note.title);
  };

  return (
    <Card
      shadow="xs"
      padding="md"
      radius="md"
      withBorder
      onClick={handleClick}
      className="group cursor-pointer self-start"
      styles={HOVER_STYLES}
    >
      <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
        <Text size="md" fw={600} lineClamp={1} style={{ flex: 1 }}>
          {note.title || 'Untitled Note'}
        </Text>
        <HoverCard
          width={400}
          shadow="md"
          openDelay={200}
          withinPortal
          onOpen={() => setPreviewOpened(true)}
        >
          <HoverCard.Target>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              data-preview-icon
              aria-label="Preview note"
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <IconEye size={15} />
            </ActionIcon>
          </HoverCard.Target>
          <HoverCard.Dropdown>
            <Text size="sm" fw={600} mb="xs">
              {note.title || 'Untitled Note'}
            </Text>
            {isLoading ? (
              <Text size="xs" c="dimmed">Loading…</Text>
            ) : fullNote?.content ? (
              <HtmlPreview html={fullNote.content} scrollHeight={300} />
            ) : (
              <Text size="xs" c="dimmed">No content</Text>
            )}
          </HoverCard.Dropdown>
        </HoverCard>
      </Group>

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
