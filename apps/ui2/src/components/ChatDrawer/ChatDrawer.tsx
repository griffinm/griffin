import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Drawer,
  Stack,
  Button,
  Text,
  Box,
  Group,
  Loader,
  ScrollArea,
} from '@mantine/core';
import { IconRobot, IconPlus } from '@tabler/icons-react';
import { getConversation, sendMessage, listConversations } from '@/api/conversationApi';
import { ConversationItem, ConversationItemRole, ConversationWithItems } from '@/types/conversation';
import { notifications } from '@mantine/notifications';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { ConversationList } from './ConversationList';

interface ChatDrawerProps {
  opened: boolean;
  onClose: () => void;
  conversationId: string | null;
  onPinChange?: (_pinned: boolean) => void;
  renderAsSidebar?: boolean;
  onConversationChange?: (_conversationId: string) => void;
  onNewChat?: () => void;
}

export const ChatDrawer = ({
  opened,
  onClose,
  conversationId,
  onPinChange,
  renderAsSidebar = false,
  onConversationChange,
  onNewChat,
}: ChatDrawerProps) => {
  const [messages, setMessages] = useState<ConversationItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationTitle, setConversationTitle] = useState<string>('');
  const [pinned, setPinned] = useState(false);
  const [historyDrawerOpened, setHistoryDrawerOpened] = useState(false);
  const [conversations, setConversations] = useState<ConversationWithItems[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const loadConversation = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    try {
      const conversation = await getConversation(conversationId);
      setMessages(conversation.conversationItems || []);
      setConversationTitle(conversation.title || 'AI Chat');
    } catch (error) {
      console.error('Error loading conversation:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load conversation',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const loadConversationHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await listConversations(1, 50);
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversation history:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load conversation history',
        color: 'red',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Sync pinned state with renderAsSidebar prop
  useEffect(() => {
    if (renderAsSidebar && !pinned) {
      setPinned(true);
    } else if (!renderAsSidebar && pinned && !opened) {
      setPinned(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderAsSidebar]);

  // Load conversation when opened or pinned
  useEffect(() => {
    if ((opened || pinned || renderAsSidebar) && conversationId) {
      loadConversation();
    }
  }, [opened, pinned, renderAsSidebar, conversationId, loadConversation]);

  // Load history when opened without conversationId
  useEffect(() => {
    if ((opened || pinned || renderAsSidebar) && !conversationId) {
      loadConversationHistory();
    }
  }, [opened, pinned, renderAsSidebar, conversationId, loadConversationHistory]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !conversationId || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    // Optimistically add user message
    const tempUserMessage: ConversationItem = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: ConversationItemRole.USER,
      content: userMessage,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await sendMessage(conversationId, userMessage);

      // Replace temp message with actual messages
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        response.userMessage,
        response.aiMessage,
      ]);

      if (response.actionTaken) {
        notifications.show({
          title: 'Action Completed',
          message: 'The requested action has been completed.',
          color: 'teal',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send message',
        color: 'red',
      });
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const isDrawerOpen = pinned || opened;

  const handleTogglePin = () => {
    const newPinned = !pinned;
    setPinned(newPinned);
    onPinChange?.(newPinned);
    if (pinned && !opened) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!pinned) {
      onClose();
    }
  };

  const handleOpenHistory = () => {
    setHistoryDrawerOpened(true);
    loadConversationHistory();
  };

  const handleSelectConversation = (selectedConversationId: string) => {
    if (onConversationChange) {
      onConversationChange(selectedConversationId);
    }
    setHistoryDrawerOpened(false);
  };

  // Render history list (when no conversation selected)
  const renderHistoryContent = () => (
    <Stack gap={0} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScrollArea style={{ flex: 1, padding: '16px' }}>
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
          isLoading={isLoadingHistory}
          onSelectConversation={handleSelectConversation}
          emptyMessage="No conversations yet"
          emptySubMessage="Start a new chat to begin"
        />
      </ScrollArea>
    </Stack>
  );

  // Render chat content
  const renderChatContent = () => {
    if (!conversationId) {
      return renderHistoryContent();
    }

    return (
      <Stack gap={0} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ScrollArea style={{ flex: 1, padding: '16px' }} viewportRef={viewportRef}>
          {isLoading ? (
            <Box style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader size="md" />
            </Box>
          ) : messages.length === 0 ? (
            <Box style={{ textAlign: 'center', padding: 40 }}>
              <Text c="dimmed">No messages yet</Text>
            </Box>
          ) : (
            <Stack gap={0}>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isSending && (
                <Box
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <Group gap="xs">
                    <Box
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#868e96',
                        color: 'white',
                      }}
                    >
                      <IconRobot size={18} />
                    </Box>
                    <Box
                      style={{
                        backgroundColor: '#f1f3f5',
                        padding: '10px 14px',
                        borderRadius: 12,
                        border: '1px solid #dee2e6',
                      }}
                    >
                      <Loader size="xs" />
                    </Box>
                  </Group>
                </Box>
              )}
            </Stack>
          )}
        </ScrollArea>

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          disabled={isSending || isLoading}
        />
      </Stack>
    );
  };

  const headerTitle = conversationId ? conversationTitle : 'Chat History';

  // Render as sidebar (pinned)
  if (renderAsSidebar) {
    return (
      <>
        <Box
          style={{
            width: '400px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            borderLeft: '1px solid #dee2e6',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
          }}
        >
          <ChatHeader
            title={headerTitle}
            pinned={pinned}
            showHistoryButton={!!conversationId}
            showCloseButton={false}
            onTogglePin={handleTogglePin}
            onOpenHistory={handleOpenHistory}
            onClose={onClose}
          />
          <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {renderChatContent()}
          </Box>
        </Box>

        <Drawer
          opened={historyDrawerOpened}
          onClose={() => setHistoryDrawerOpened(false)}
          position="right"
          size="md"
          title="Chat History"
        >
          <ScrollArea style={{ height: 'calc(100vh - 60px)' }}>
            <Box p="md">
              <ConversationList
                conversations={conversations}
                isLoading={isLoadingHistory}
                activeConversationId={conversationId}
                onSelectConversation={handleSelectConversation}
              />
            </Box>
          </ScrollArea>
        </Drawer>
      </>
    );
  }

  // Render as drawer
  return (
    <>
      <Drawer
        opened={isDrawerOpen}
        onClose={handleClose}
        position="right"
        size="md"
        withOverlay={!pinned}
        closeOnClickOutside={!pinned}
        closeOnEscape={!pinned}
        withCloseButton={false}
        title={
          <ChatHeader
            title={headerTitle}
            pinned={pinned}
            showHistoryButton={!!conversationId}
            showCloseButton={!pinned}
            onTogglePin={handleTogglePin}
            onOpenHistory={handleOpenHistory}
            onClose={onClose}
          />
        }
        styles={{
          body: {
            height: 'calc(100% - 60px)',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
          },
          header: {
            borderBottom: '1px solid #dee2e6',
            padding: 0,
          },
        }}
      >
        {renderChatContent()}
      </Drawer>

      <Drawer
        opened={historyDrawerOpened}
        onClose={() => setHistoryDrawerOpened(false)}
        position="right"
        size="md"
        title="Chat History"
      >
        <ScrollArea style={{ height: 'calc(100vh - 60px)' }}>
          <Box p="md">
            <ConversationList
              conversations={conversations}
              isLoading={isLoadingHistory}
              activeConversationId={conversationId}
              onSelectConversation={handleSelectConversation}
            />
          </Box>
        </ScrollArea>
      </Drawer>
    </>
  );
};
