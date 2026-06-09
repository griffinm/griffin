import { Drawer, ScrollArea, Box } from '@mantine/core';
import { ConversationWithItems } from '@/types/conversation';
import { ConversationList } from './ConversationList';

interface ChatHistoryDrawerProps {
  opened: boolean;
  onClose: () => void;
  conversations: ConversationWithItems[];
  isLoading: boolean;
  activeConversationId: string | null;
  onSelectConversation: (_conversationId: string) => void;
  onDeleteConversation: (_conversationId: string) => void;
  onRenameConversation?: (_conversationId: string, _title: string) => void;
}

export const ChatHistoryDrawer = ({
  opened,
  onClose,
  conversations,
  isLoading,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
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
            onRenameConversation={onRenameConversation}
          />
        </Box>
      </ScrollArea>
    </Drawer>
  );
};
