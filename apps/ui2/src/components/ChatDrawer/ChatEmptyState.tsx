import { Box, Button, Text } from '@mantine/core';
import { AssistantMark } from './AssistantMark';

const SUGGESTED_PROMPTS = [
  'Summarize my notes from this week',
  'What tasks are overdue?',
  'Find notes related to a project',
  'Create a task for me',
];

interface ChatEmptyStateProps {
  /** Called with the chosen prompt text; the container decides how to start. */
  onSelectPrompt: (_text: string) => void;
  /** Smaller layout for the narrow drawer. */
  compact?: boolean;
  greeting?: string;
}

/**
 * Welcoming empty state — a Fraunces hero greeting under the signature mark,
 * with a row of suggested starter prompts.
 */
export const ChatEmptyState = ({
  onSelectPrompt,
  compact = false,
  greeting = 'How can I help?',
}: ChatEmptyStateProps) => (
  <Box
    style={{
      position: 'relative',
      zIndex: 1,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      minHeight: compact ? undefined : '58vh',
      padding: compact ? '40px 20px' : '56px 24px',
    }}
  >
    <AssistantMark size={compact ? 30 : 44} />
    <Text
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: compact ? 27 : 42,
        fontWeight: 500,
        lineHeight: 1.08,
        letterSpacing: '-0.01em',
        marginTop: 18,
      }}
    >
      {greeting}
    </Text>
    <Text c="dimmed" size="sm" mt={10} style={{ maxWidth: 440 }}>
      Ask about your notes and tasks, search your workspace, or create something new.
    </Text>

    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginTop: 26,
        maxWidth: 540,
      }}
    >
      {SUGGESTED_PROMPTS.map((prompt) => (
        <Button
          key={prompt}
          variant="default"
          radius="xl"
          size="sm"
          onClick={() => onSelectPrompt(prompt)}
          styles={{
            root: {
              fontWeight: 400,
              transition: 'border-color 140ms ease, transform 140ms ease',
            },
            label: { whiteSpace: 'normal' },
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--chat-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '';
          }}
        >
          {prompt}
        </Button>
      ))}
    </div>
  </Box>
);
