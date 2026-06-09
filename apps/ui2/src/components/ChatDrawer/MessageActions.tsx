import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { IconCheck, IconCopy, IconRefresh } from '@tabler/icons-react';

interface MessageActionsProps {
  /** Raw message content copied to the clipboard. */
  content: string;
  /** Provided only where regeneration makes sense (the latest assistant turn). */
  onRegenerate?: () => void;
  className?: string;
}

/**
 * Hover actions for a single message: copy, and an optional regenerate
 * affordance. Styled as quiet ghost buttons that reveal on message hover.
 */
export const MessageActions = ({ content, onRegenerate, className }: MessageActionsProps) => {
  const clipboard = useClipboard({ timeout: 1500 });

  return (
    <Group gap={2} wrap="nowrap" className={className}>
      <Tooltip label={clipboard.copied ? 'Copied' : 'Copy'} withArrow openDelay={300}>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          aria-label="Copy message"
          onClick={() => clipboard.copy(content)}
        >
          {clipboard.copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
        </ActionIcon>
      </Tooltip>
      {onRegenerate && (
        <Tooltip label="Regenerate" withArrow openDelay={300}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            aria-label="Regenerate response"
            onClick={onRegenerate}
          >
            <IconRefresh size={15} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
};
