import { Text, Badge, Group } from '@mantine/core';
import { IconNote } from '@tabler/icons-react';

interface ChatNoteCardProps {
  note: {
    id: string;
    title: string;
    notebookId?: string;
    snippet?: string;        // From search results
    matchedField?: string;   // From search results
    content?: string;        // From full note
  };
}

export function ChatNoteCard({ note }: ChatNoteCardProps) {
  const handleClick = () => {
    if (note.id) {
      // Use window.location for navigation to avoid useNavigate hook issues
      window.location.href = `/notes/${note.id}`;
    }
  };

  // Get preview text - use snippet (from search) or content (from full note)
  const getPreview = () => {
    if (note.snippet) {
      return note.snippet;
    }
    if (note.content) {
      // Strip HTML tags and truncate
      const stripped = note.content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      return stripped.length > 150 ? stripped.substring(0, 150) + '...' : stripped;
    }
    return null;
  };

  const preview = getPreview();

  return (
    <div
      onClick={handleClick}
      className="flex flex-row bg-white rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-gray-300 overflow-hidden"
    >
      {/* Left accent bar */}
      <div className="w-1 bg-blue-400 rounded-l-md" />

      {/* Content */}
      <div className="flex flex-col p-3 flex-1 min-w-0 gap-1">
        {/* Title row */}
        <Group gap="xs" wrap="nowrap">
          <IconNote size={16} className="text-blue-500 flex-shrink-0" />
          <Text size="sm" fw={600} lineClamp={1} className="flex-1 min-w-0">
            {note.title || 'Untitled Note'}
          </Text>
        </Group>

        {/* Preview text */}
        {preview && (
          <Text size="xs" c="dimmed" lineClamp={2} className="mt-1">
            {preview}
          </Text>
        )}

        {/* Matched field badge (for search results) */}
        {note.matchedField && (
          <Group gap="xs" mt="xs">
            <Badge size="xs" variant="light" color="blue">
              Matched in {note.matchedField}
            </Badge>
          </Group>
        )}
      </div>
    </div>
  );
}
