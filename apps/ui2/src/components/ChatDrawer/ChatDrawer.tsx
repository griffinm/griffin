import { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Stack,
  TextInput,
  Button,
  Text,
  Box,
  Group,
  Loader,
  ActionIcon,
  ScrollArea,
} from '@mantine/core';
import { IconSend, IconX, IconRobot, IconUser } from '@tabler/icons-react';
import { getConversation, sendMessage } from '@/api/conversationApi';
import { ConversationItem, ConversationItemRole } from '@/types/conversation';
import { notifications } from '@mantine/notifications';
import { ChatComponentRenderer } from './ChatComponentRenderer';

interface ChatDrawerProps {
  opened: boolean;
  onClose: () => void;
  conversationId: string | null;
}

export const ChatDrawer = ({ opened, onClose, conversationId }: ChatDrawerProps) => {
  const [messages, setMessages] = useState<ConversationItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationTitle, setConversationTitle] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Load conversation when opened
  useEffect(() => {
    if (opened && conversationId) {
      loadConversation();
    }
  }, [opened, conversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const loadConversation = async () => {
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
  };

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

      // If action was taken, show notification
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
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: ConversationItem) => {
    const isUser = message.role === ConversationItemRole.USER;
    const isAssistant = message.role === ConversationItemRole.ASSISTANT;
    const isTool = message.role === ConversationItemRole.TOOL;

    console.log('Rendering message:', { role: message.role, hasComponentData: !!message.componentData, componentData: message.componentData });

    // Render tool messages if they have componentData
    if (isTool) {
      console.log('Tool message:', message);
      if (!message.componentData) {
        console.log('Tool message has no componentData, skipping');
        return null; // Don't show tool messages without component data
      }

      // Render tool message with component data
      return (
        <Box
          key={message.id}
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: 12,
          }}
        >
          <Group
            gap="xs"
            style={{
              maxWidth: '90%',
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
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
                flexShrink: 0,
              }}
            >
              <IconRobot size={18} />
            </Box>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <ChatComponentRenderer componentData={message.componentData} />
            </Box>
          </Group>
        </Box>
      );
    }

    return (
      <Box
        key={message.id}
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: 12,
        }}
      >
        <Group
          gap="xs"
          style={{
            maxWidth: '85%',
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
          }}
        >
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isUser ? '#228be6' : '#868e96',
              color: 'white',
              flexShrink: 0,
            }}
          >
            {isUser ? <IconUser size={18} /> : <IconRobot size={18} />}
          </Box>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Box
              style={{
                backgroundColor: isUser ? '#e7f5ff' : '#f1f3f5',
                padding: '10px 14px',
                borderRadius: 12,
                border: `1px solid ${isUser ? '#d0ebff' : '#dee2e6'}`,
              }}
            >
              <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {message.content}
              </Text>
            </Box>
            {/* Render component data if present */}
            {message.componentData && (
              <ChatComponentRenderer componentData={message.componentData} />
            )}
          </Box>
        </Group>
      </Box>
    );
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="md"
      title={
        <Group justify="space-between" style={{ width: '100%' }}>
          <Text fw={600}>{conversationTitle}</Text>
        </Group>
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
        },
      }}
    >
      <Stack gap={0} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Messages area */}
        <ScrollArea
          style={{ flex: 1, padding: '16px' }}
          viewportRef={viewportRef}
        >
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
              {messages.map((message) => renderMessage(message))}
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

        {/* Input area */}
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
              value={inputValue}
              onChange={(e) => setInputValue(e.currentTarget.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending || isLoading}
              style={{ flex: 1 }}
              size="md"
            />
            <ActionIcon
              size="lg"
              variant="filled"
              color="blue"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending || isLoading}
              style={{ width: 42, height: 42 }}
            >
              <IconSend size={20} />
            </ActionIcon>
          </Group>
        </Box>
      </Stack>
    </Drawer>
  );
};

