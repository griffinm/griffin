import { Card, Text } from '@mantine/core';
import { IconNotebook } from '@tabler/icons-react';
import { NoteResult } from '@/types/search';

interface SearchResultCardProps {
  result: NoteResult;
  notebookPath: string[];
  onClick: () => void;
}

export function SearchResultCard({ result, notebookPath, onClick }: SearchResultCardProps) {
  const matchedTitle = result.matchedField === 'title';

  return (
    <Card
      padding="lg"
      radius="md"
      withBorder
      onClick={onClick}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Teal accent rail, revealed on hover */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] bg-[var(--mantine-color-teal-filled)] opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
      />

      <div className="flex-1">
        <Text size="lg" fw={600} lineClamp={2} className="tracking-tight">
          {result.title || 'Untitled Note'}
        </Text>

        {notebookPath.length > 0 && (
          <Text
            size="xs"
            c="dimmed"
            lineClamp={1}
            className="mt-1.5 flex items-center gap-1.5"
          >
            <IconNotebook size={13} className="shrink-0 opacity-60" />
            <span className="truncate">
              {notebookPath.map((segment, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1 opacity-40">›</span>}
                  {segment}
                </span>
              ))}
            </span>
          </Text>
        )}

        {result.snippet && (
          <Text
            size="sm"
            c="dimmed"
            lineClamp={3}
            dangerouslySetInnerHTML={{ __html: result.snippet }}
            className="mt-3 leading-relaxed [&_mark]:rounded-sm [&_mark]:bg-[var(--mantine-color-teal-light)] [&_mark]:px-1 [&_mark]:py-px [&_mark]:font-medium [&_mark]:text-[var(--mantine-color-teal-light-color)]"
          />
        )}
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--mantine-color-dimmed)]">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            matchedTitle
              ? 'bg-[var(--mantine-color-teal-filled)]'
              : 'bg-[var(--mantine-color-gray-4)]'
          }`}
        />
        {matchedTitle ? 'Title match' : 'Content match'}
      </div>
    </Card>
  );
}
