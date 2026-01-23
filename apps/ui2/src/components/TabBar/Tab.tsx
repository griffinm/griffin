import { ActionIcon, Text, useMantineTheme } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

interface TabProps {
  noteId: string;
  title: string;
  isActive: boolean;
  onClose: () => void;
  onClick: () => void;
}

export function Tab({ title, isActive, onClose, onClick }: TabProps) {
  const theme = useMantineTheme();

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: theme.radius.sm,
        background: isActive ? theme.colors.blue[0] : theme.colors.gray[1],
        border: `1px solid ${isActive ? theme.colors.blue[3] : theme.colors.gray[3]}`,
        cursor: 'pointer',
        maxWidth: 150,
        minWidth: 80,
        height: 28,
        flexShrink: 0,
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = theme.colors.gray[2];
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = theme.colors.gray[1];
        }
      }}
    >
      <Text
        size="xs"
        fw={isActive ? 500 : 400}
        c={isActive ? 'blue.7' : 'gray.7'}
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </Text>
      <ActionIcon
        size="xs"
        variant="subtle"
        color="gray"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{ flexShrink: 0 }}
      >
        <IconX size={12} />
      </ActionIcon>
    </div>
  );
}
