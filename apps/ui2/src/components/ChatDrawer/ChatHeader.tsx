import { Text, Group, ActionIcon } from '@mantine/core';
import {
  IconX,
  IconPin,
  IconPinFilled,
  IconHistory,
  IconArrowsDiagonal,
} from '@tabler/icons-react';
import { AssistantMark } from './AssistantMark';

interface ChatHeaderProps {
  title: string;
  pinned: boolean;
  showHistoryButton?: boolean;
  showCloseButton?: boolean;
  showExpandButton?: boolean;
  onTogglePin: () => void;
  onOpenHistory?: () => void;
  onExpand?: () => void;
  onClose: () => void;
}

export const ChatHeader = ({
  title,
  pinned,
  showHistoryButton = false,
  showCloseButton = true,
  showExpandButton = true,
  onTogglePin,
  onOpenHistory,
  onExpand,
  onClose,
}: ChatHeaderProps) => {
  return (
    <Group justify="space-between" style={{ width: '100%', padding: '12px 16px' }} wrap="nowrap">
      <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
        <AssistantMark size={16} />
        <Text fw={600} truncate>
          {title}
        </Text>
      </Group>
      <Group gap="xs" wrap="nowrap">
        {showExpandButton && onExpand && (
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onExpand}
            size="sm"
            title="Open full page"
          >
            <IconArrowsDiagonal size={18} />
          </ActionIcon>
        )}
        {showHistoryButton && onOpenHistory && (
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onOpenHistory}
            size="sm"
            title="Chat History"
          >
            <IconHistory size={18} />
          </ActionIcon>
        )}
        <ActionIcon
          variant={pinned ? 'filled' : 'subtle'}
          color={pinned ? 'blue' : 'gray'}
          onClick={onTogglePin}
          size="sm"
        >
          {pinned ? <IconPinFilled size={18} /> : <IconPin size={18} />}
        </ActionIcon>
        {showCloseButton && (
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onClose}
            size="sm"
          >
            <IconX size={18} />
          </ActionIcon>
        )}
      </Group>
    </Group>
  );
};
