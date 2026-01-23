import { TextInput, Box, Group, ActionIcon } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export const ChatInput = ({ value, onChange, onSend, disabled = false }: ChatInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Box
      style={{
        padding: '16px',
        borderTop: '1px solid #dee2e6',
        backgroundColor: 'white',
      }}
    >
      <Group gap="xs" wrap="nowrap">
        <TextInput
          placeholder="Type a message..."
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          style={{ flex: 1 }}
          size="md"
        />
        <ActionIcon
          size="lg"
          variant="filled"
          color="blue"
          onClick={onSend}
          disabled={!value.trim() || disabled}
          style={{ width: 42, height: 42 }}
        >
          <IconSend size={20} />
        </ActionIcon>
      </Group>
    </Box>
  );
};
