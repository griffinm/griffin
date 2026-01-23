import { Drawer, ScrollArea, Box } from '@mantine/core';
import { ConversationWithItems } from '@/types/conversation';
import { ConversationList } from './ConversationList';

interface ChatHistoryDrawerProps {
  opened: boolean;
  onClose: () => void;
  conversations: ConversationWithItems[];
  isLoading: boolean;
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

export const ChatHistoryDrawer = ({
  opened,
  onClose,
  conversations,
  isLoading,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
}: ChatHistoryDrawerProps) => {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title="Chat History"
    >
      <ScrollArea style={{ height: 'calc(100vh - 60px)' }}>
        <Box p="md">
          <ConversationList
            conversations={conversations}
            isLoading={isLoading}
            activeConversationId={activeConversationId}
            onSelectConversation={onSelectConversation}
            onDeleteConversation={onDeleteConversation}
          />
        </Box>
      </ScrollArea>
    </Drawer>
  );
};
