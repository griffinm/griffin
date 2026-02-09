import { Text, Box, Stack, Loader, Menu, ActionIcon, Group } from '@mantine/core';
import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { ConversationWithItems } from '@/types/conversation';

interface ConversationListProps {
  conversations: ConversationWithItems[];
  isLoading: boolean;
  activeConversationId?: string | null;
  onSelectConversation: (_conversationId: string) => void;
  onDeleteConversation?: (_conversationId: string) => void;
  emptyMessage?: string;
  emptySubMessage?: string;
}

export const ConversationList = ({
  conversations,
  isLoading,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  emptyMessage = 'No conversations yet',
  emptySubMessage,
}: ConversationListProps) => {
  if (isLoading) {
    return (
      <Box style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Loader size="md" />
      </Box>
    );
  }

  if (conversations.length === 0) {
    return (
      <Box style={{ textAlign: 'center', padding: 40 }}>
        <Text c="dimmed">{emptyMessage}</Text>
        {emptySubMessage && (
          <Text size="sm" c="dimmed" mt="xs">
            {emptySubMessage}
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Stack gap="xs">
      {conversations.map((conversation) => {
        const isActive = conversation.id === activeConversationId;
        const previewMessage = conversation.conversationItems?.[0];
        const previewText = previewMessage?.content || 'No messages';
        const truncatedPreview =
          previewText.length > 100
            ? previewText.substring(0, 100) + '...'
            : previewText;

        return (
          <Box
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            style={{
              padding: '12px',
              borderRadius: 8,
              border: `1px solid ${isActive ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-3)'}`,
              backgroundColor: isActive ? 'var(--mantine-color-blue-light)' : 'var(--mantine-color-body)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--mantine-color-body)';
              }
            }}
          >
            <Group justify="space-between" align="flex-start" mb={4}>
              <Text fw={isActive ? 600 : 500} size="sm" style={{ flex: 1 }}>
                {conversation.title || 'Untitled Chat'}
              </Text>
              {onDeleteConversation && (
                <Menu position="bottom-end" shadow="md">
                  <Menu.Target>
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconDotsVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconTrash size={14} />}
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
            </Group>
            <Text
              size="xs"
              c="dimmed"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {truncatedPreview}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              {new Date(conversation.updatedAt).toLocaleDateString()}{' '}
              {new Date(conversation.updatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Box>
        );
      })}
    </Stack>
  );
};
