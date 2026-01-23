import { Stack, Button, ScrollArea } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { ConversationWithItems } from '@/types/conversation';
import { ConversationList } from './ConversationList';

interface ChatHistoryPanelProps {
  conversations: ConversationWithItems[];
  isLoading: boolean;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewChat?: () => void;
}

export const ChatHistoryPanel = ({
  conversations,
  isLoading,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
}: ChatHistoryPanelProps) => {
  return (
    <Stack gap={0} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScrollArea style={{ flex: 1, paddingTop: '16px', paddingBottom: '16px' }}>
        {onNewChat && (
          <Button
            fullWidth
            leftSection={<IconPlus size={18} />}
            variant="light"
            color="teal"
            mb="md"
            onClick={onNewChat}
          >
            New Chat
          </Button>
        )}
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          emptyMessage="No conversations yet"
          emptySubMessage="Start a new chat to begin"
        />
      </ScrollArea>
    </Stack>
  );
};
