import { Text, Group, ActionIcon } from '@mantine/core';
import { IconX, IconPin, IconPinFilled, IconHistory } from '@tabler/icons-react';

interface ChatHeaderProps {
  title: string;
  pinned: boolean;
  showHistoryButton?: boolean;
  showCloseButton?: boolean;
  onTogglePin: () => void;
  onOpenHistory?: () => void;
  onClose: () => void;
}

export const ChatHeader = ({
  title,
  pinned,
  showHistoryButton = false,
  showCloseButton = true,
  onTogglePin,
  onOpenHistory,
  onClose,
}: ChatHeaderProps) => {
  return (
    <Group justify="space-between" style={{ width: '100%', padding: '12px 16px' }}>
      <Text fw={600}>{title}</Text>
      <Group gap="xs">
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
