import { Card, Text, Group, ActionIcon, HoverCard, Badge } from '@mantine/core';
import { IconEye, IconHelp } from '@tabler/icons-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Question } from '@/types/question';
import { useNavigate } from 'react-router-dom';

interface UnansweredQuestionCardProps {
  question: Question;
}

export function UnansweredQuestionCard({ question }: UnansweredQuestionCardProps) {
  const navigate = useNavigate();

  const questionPreview = question.question.length > 80
    ? `${question.question.substring(0, 80)}...`
    : question.question;

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the preview icon
    if ((e.target as HTMLElement).closest('[data-preview-icon]')) {
      return;
    }
    navigate(`/notes/${question.noteId}`);
  };

  return (
    <Card
      shadow="xs"
      padding="sm"
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
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <IconHelp size={16} style={{ flexShrink: 0, opacity: 0.6 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" lineClamp={2} mb={4}>
              {questionPreview}
            </Text>
            <Text size="xs" c="dimmed">
              {formatDistanceToNowStrict(new Date(question.createdAt), { addSuffix: true })}
            </Text>
          </div>
        </Group>
        
        <HoverCard width={400} shadow="md" openDelay={200}>
          <HoverCard.Target>
            <ActionIcon 
              variant="subtle" 
              size="sm"
              data-preview-icon
              onClick={(e) => e.stopPropagation()}
              style={{ flexShrink: 0 }}
            >
              <IconEye size={16} />
            </ActionIcon>
          </HoverCard.Target>
          <HoverCard.Dropdown>
            <Group gap="xs" mb="xs">
              <IconHelp size={16} />
              <Badge size="sm" color="orange" variant="light">
                Unanswered
              </Badge>
            </Group>
            <Text size="sm" fw={600} mb="xs">
              Question:
            </Text>
            <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
              {question.question}
            </Text>
            <Text size="xs" c="dimmed" mt="md">
              Created {formatDistanceToNowStrict(new Date(question.createdAt), { addSuffix: true })}
            </Text>
          </HoverCard.Dropdown>
        </HoverCard>
      </Group>
    </Card>
  );
}

