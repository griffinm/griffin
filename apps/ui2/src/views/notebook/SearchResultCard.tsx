import { Card, Text, Badge, Group } from '@mantine/core';
import { IconNotebook } from '@tabler/icons-react';
import { NoteResult } from '@/types/search';

interface SearchResultCardProps {
  result: NoteResult;
  notebookName: string;
  onClick: () => void;
}

export function SearchResultCard({ result, notebookName, onClick }: SearchResultCardProps) {
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
        <Text size="lg" fw={600} mb="xs" lineClamp={2}>
          {result.title || 'Untitled Note'}
        </Text>

        <Group gap="xs" mb="sm">
          <IconNotebook size={14} style={{ opacity: 0.5 }} />
          <Text size="xs" c="dimmed">
            {notebookName}
          </Text>
        </Group>

        {result.snippet && (
          <div className="mb-3">
            <Text
              size="sm"
              c="dimmed"
              lineClamp={3}
              dangerouslySetInnerHTML={{ __html: result.snippet }}
              className="[&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:rounded"
            />
          </div>
        )}
      </div>

      <Group justify="space-between" mt="auto" pt="md">
        <Badge size="xs" variant="light" color={result.matchedField === 'title' ? 'blue' : 'gray'}>
          Matched in {result.matchedField || 'content'}
        </Badge>
      </Group>
    </Card>
  );
}
