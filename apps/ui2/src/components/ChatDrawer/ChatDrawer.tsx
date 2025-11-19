import { useState, useEffect, useRef, useCallback } from 'react';
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
import { IconSend, IconX, IconRobot, IconUser, IconPin, IconPinFilled, IconHistory } from '@tabler/icons-react';
import { getConversation, sendMessage, listConversations } from '@/api/conversationApi';
import { ConversationItem, ConversationItemRole, ConversationWithItems } from '@/types/conversation';
import { notifications } from '@mantine/notifications';
import { ChatComponentRenderer } from './ChatComponentRenderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatDrawerProps {
  opened: boolean;
  onClose: () => void;
  conversationId: string | null;
  onPinChange?: (_pinned: boolean) => void;
  renderAsSidebar?: boolean;
  onConversationChange?: (_conversationId: string) => void;
}

export const ChatDrawer = ({ opened, onClose, conversationId, onPinChange, renderAsSidebar = false, onConversationChange }: ChatDrawerProps) => {
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

  // Sync pinned state with renderAsSidebar prop (only when renderAsSidebar changes)
  useEffect(() => {
    if (renderAsSidebar && !pinned) {
      setPinned(true);
    } else if (!renderAsSidebar && pinned && !opened) {
      // Only reset if drawer is not opened (to avoid conflicts with user interaction)
      setPinned(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderAsSidebar]); // Only sync when renderAsSidebar changes to avoid conflicts

  // Load conversation when opened or pinned
  useEffect(() => {
    if ((opened || pinned || renderAsSidebar) && conversationId) {
      loadConversation();
    }
  }, [opened, pinned, renderAsSidebar, conversationId, loadConversation]);

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
              <Box
                component="div"
                style={{
                  fontSize: '14px',
                  lineHeight: 1.6,
                  wordBreak: 'break-word',
                }}
              >
                {message.content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                    p: ({ children }) => <Text size="sm" component="p" style={{ margin: '0 0 8px 0' }}>{children}</Text>,
                    h1: ({ children }) => <Text size="xl" fw={700} component="h1" style={{ margin: '0 0 8px 0' }}>{children}</Text>,
                    h2: ({ children }) => <Text size="lg" fw={700} component="h2" style={{ margin: '0 0 8px 0' }}>{children}</Text>,
                    h3: ({ children }) => <Text size="md" fw={700} component="h3" style={{ margin: '0 0 8px 0' }}>{children}</Text>,
                    h4: ({ children }) => <Text size="sm" fw={700} component="h4" style={{ margin: '0 0 8px 0' }}>{children}</Text>,
                    h5: ({ children }) => <Text size="sm" fw={600} component="h5" style={{ margin: '0 0 8px 0' }}>{children}</Text>,
                    h6: ({ children }) => <Text size="sm" fw={600} component="h6" style={{ margin: '0 0 8px 0' }}>{children}</Text>,
                    ul: ({ children }) => <Box component="ul" style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>{children}</Box>,
                    ol: ({ children }) => <Box component="ol" style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>{children}</Box>,
                    li: ({ children }) => <Text size="sm" component="li" style={{ marginBottom: '4px' }}>{children}</Text>,
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <Text
                          size="sm"
                          component="code"
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                          }}
                        >
                          {children}
                        </Text>
                      ) : (
                        <Box
                          component="pre"
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            padding: '12px',
                            borderRadius: '6px',
                            overflow: 'auto',
                            margin: '8px 0',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                          }}
                        >
                          <Text size="sm" component="code" style={{ fontFamily: 'monospace' }}>{children}</Text>
                        </Box>
                      );
                    },
                    blockquote: ({ children }) => (
                      <Box
                        component="blockquote"
                        style={{
                          borderLeft: '3px solid #dee2e6',
                          paddingLeft: '12px',
                          margin: '8px 0',
                          fontStyle: 'italic',
                          color: '#868e96',
                        }}
                      >
                        <Text size="sm">{children}</Text>
                      </Box>
                    ),
                    a: ({ href, children }) => (
                      <Text
                        size="sm"
                        component="a"
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#228be6',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                        }}
                      >
                        {children}
                      </Text>
                    ),
                    table: ({ children }) => (
                      <Box
                        component="table"
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          margin: '8px 0',
                          fontSize: '14px',
                        }}
                      >
                        {children}
                      </Box>
                    ),
                    thead: ({ children }) => (
                      <Box component="thead" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                        {children}
                      </Box>
                    ),
                    tbody: ({ children }) => <Box component="tbody">{children}</Box>,
                    tr: ({ children }) => (
                      <Box component="tr" style={{ borderBottom: '1px solid #dee2e6' }}>
                        {children}
                      </Box>
                    ),
                    th: ({ children }) => (
                      <Text
                        size="sm"
                        component="th"
                        fw={600}
                        style={{
                          padding: '8px',
                          textAlign: 'left',
                          borderRight: '1px solid #dee2e6',
                        }}
                      >
                        {children}
                      </Text>
                    ),
                    td: ({ children }) => (
                      <Text
                        size="sm"
                        component="td"
                        style={{
                          padding: '8px',
                          borderRight: '1px solid #dee2e6',
                        }}
                      >
                        {children}
                      </Text>
                    ),
                    hr: () => (
                      <Box
                        component="hr"
                        style={{
                          border: 'none',
                          borderTop: '1px solid #dee2e6',
                          margin: '12px 0',
                        }}
                      />
                    ),
                    strong: ({ children }) => <Text size="sm" fw={700} component="strong">{children}</Text>,
                    em: ({ children }) => <Text size="sm" component="em" style={{ fontStyle: 'italic' }}>{children}</Text>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                ) : (
                  <Text size="sm" c="dimmed">Empty message</Text>
                )}
              </Box>
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

  // When pinned, keep drawer open even if opened prop is false
  const isDrawerOpen = pinned || opened;

  const handleTogglePin = () => {
    const newPinned = !pinned;
    setPinned(newPinned);
    onPinChange?.(newPinned);
    // If unpinning and drawer was only open because it was pinned, close it
    if (pinned && !opened) {
      onClose();
    }
  };

  const handleClose = () => {
    // Only close if not pinned
    if (!pinned) {
      onClose();
    }
  };

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

  // Render chat content (shared between Drawer and Sidebar)
  const renderChatContent = () => (
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
  );

  // Render header (shared between Drawer and Sidebar)
  const renderHeader = () => (
    <Group justify="space-between" style={{ width: '100%', padding: '12px 16px', borderBottom: '1px solid #dee2e6' }}>
      <Text fw={600}>{conversationTitle}</Text>
      <Group gap="xs">
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={handleOpenHistory}
          size="sm"
          title="Chat History"
        >
          <IconHistory size={18} />
        </ActionIcon>
        <ActionIcon
          variant={pinned ? 'filled' : 'subtle'}
          color={pinned ? 'blue' : 'gray'}
          onClick={handleTogglePin}
          size="sm"
        >
          {pinned ? <IconPinFilled size={18} /> : <IconPin size={18} />}
        </ActionIcon>
        {!pinned && !renderAsSidebar && (
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

  // If rendering as sidebar (pinned), render as a Box instead of Drawer
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
          {renderHeader()}
          <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {renderChatContent()}
          </Box>
        </Box>

        {/* Conversation History Drawer */}
        <Drawer
          opened={historyDrawerOpened}
          onClose={() => setHistoryDrawerOpened(false)}
          position="right"
          size="md"
          title="Chat History"
        >
          <ScrollArea style={{ height: 'calc(100vh - 60px)' }}>
            {isLoadingHistory ? (
              <Box style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader size="md" />
              </Box>
            ) : conversations.length === 0 ? (
              <Box style={{ textAlign: 'center', padding: 40 }}>
                <Text c="dimmed">No conversations yet</Text>
              </Box>
            ) : (
              <Stack gap="xs" p="md">
                {conversations.map((conversation) => {
                  const isActive = conversation.id === conversationId;
                  const previewMessage = conversation.conversationItems?.[0];
                  const previewText = previewMessage?.content || 'No messages';
                  const truncatedPreview = previewText.length > 100 
                    ? previewText.substring(0, 100) + '...' 
                    : previewText;

                  return (
                    <Box
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation.id)}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: `1px solid ${isActive ? '#228be6' : '#dee2e6'}`,
                        backgroundColor: isActive ? '#e7f5ff' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <Text fw={isActive ? 600 : 500} size="sm" mb={4}>
                        {conversation.title || 'Untitled Chat'}
                      </Text>
                      <Text size="xs" c="dimmed" style={{ 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {truncatedPreview}
                      </Text>
                      <Text size="xs" c="dimmed" mt={4}>
                        {new Date(conversation.updatedAt).toLocaleDateString()} {new Date(conversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </ScrollArea>
        </Drawer>
      </>
    );
  }

  // Otherwise render as Drawer
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
        title={renderHeader()}
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

      {/* Conversation History Drawer */}
      <Drawer
        opened={historyDrawerOpened}
        onClose={() => setHistoryDrawerOpened(false)}
        position="right"
        size="md"
        title="Chat History"
      >
        <ScrollArea style={{ height: 'calc(100vh - 60px)' }}>
          {isLoadingHistory ? (
            <Box style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader size="md" />
            </Box>
          ) : conversations.length === 0 ? (
            <Box style={{ textAlign: 'center', padding: 40 }}>
              <Text c="dimmed">No conversations yet</Text>
            </Box>
          ) : (
            <Stack gap="xs" p="md">
              {conversations.map((conversation) => {
                const isActive = conversation.id === conversationId;
                const previewMessage = conversation.conversationItems?.[0];
                const previewText = previewMessage?.content || 'No messages';
                const truncatedPreview = previewText.length > 100 
                  ? previewText.substring(0, 100) + '...' 
                  : previewText;

                return (
                  <Box
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    style={{
                      padding: '12px',
                      borderRadius: 8,
                      border: `1px solid ${isActive ? '#228be6' : '#dee2e6'}`,
                      backgroundColor: isActive ? '#e7f5ff' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <Text fw={isActive ? 600 : 500} size="sm" mb={4}>
                      {conversation.title || 'Untitled Chat'}
                    </Text>
                    <Text size="xs" c="dimmed" style={{ 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      {truncatedPreview}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {new Date(conversation.updatedAt).toLocaleDateString()} {new Date(conversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Box>
                );
              })}
            </Stack>
          )}
        </ScrollArea>
      </Drawer>
    </>
  );
};

