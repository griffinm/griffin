import { useState, useEffect, useRef, useCallback } from 'react';
import { getConversation, sendMessage, listConversations, deleteConversation } from '@/api/conversationApi';
import { ConversationItem, ConversationItemRole, ConversationWithItems } from '@/types/conversation';
import { notifications } from '@mantine/notifications';
import { useConversationPolling } from '@/hooks/useConversationPolling';

interface UseChatOptions {
  conversationId: string | null;
  isActive: boolean; // Whether the chat is visible (opened, pinned, or sidebar)
  onConversationChange?: (conversationId: string) => void;
}

export const useChat = ({ conversationId, isActive, onConversationChange }: UseChatOptions) => {
  const [messages, setMessages] = useState<ConversationItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [conversationTitle, setConversationTitle] = useState<string>('');
  const [conversations, setConversations] = useState<ConversationWithItems[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<Date>(new Date());

  // Setup polling for AI responses
  const { startPolling } = useConversationPolling({
    conversationId,
    enabled: isWaitingForResponse,
    interval: 1000,
    onNewMessages: (newMessages) => {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueNewMessages = newMessages.filter((m) => !existingIds.has(m.id));
        return [...prev, ...uniqueNewMessages];
      });
    },
    onTitleUpdate: (title) => {
      setConversationTitle(title);
    },
    onComplete: () => {
      setIsWaitingForResponse(false);
      setIsSending(false);
    },
    onError: (errorMessage) => {
      setIsWaitingForResponse(false);
      setIsSending(false);
      notifications.show({
        title: 'Error',
        message: errorMessage || 'Failed to get response',
        color: 'red',
      });
    },
  });

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

  // Load conversation when active and has conversationId
  useEffect(() => {
    if (isActive && conversationId) {
      loadConversation();
    }
  }, [isActive, conversationId, loadConversation]);

  // Load history when active without conversationId
  useEffect(() => {
    if (isActive && !conversationId) {
      loadConversationHistory();
    }
  }, [isActive, conversationId, loadConversationHistory]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !conversationId || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsSending(true);
    setIsWaitingForResponse(true);

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

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        response.userMessage,
      ]);

      lastMessageTimeRef.current = new Date(response.userMessage.createdAt);
      startPolling(lastMessageTimeRef.current);
    } catch (error) {
      console.error('Error sending message:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send message',
        color: 'red',
      });
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      setIsSending(false);
      setIsWaitingForResponse(false);
    }
  }, [inputValue, conversationId, isSending, startPolling]);

  const handleDeleteConversation = useCallback(async (deletedConversationId: string) => {
    try {
      await deleteConversation(deletedConversationId);

      setConversations((prev) => prev.filter((c) => c.id !== deletedConversationId));

      if (deletedConversationId === conversationId && onConversationChange) {
        onConversationChange('');
      }

      notifications.show({
        title: 'Deleted',
        message: 'Conversation deleted',
        color: 'teal',
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete conversation',
        color: 'red',
      });
    }
  }, [conversationId, onConversationChange]);

  return {
    // State
    messages,
    inputValue,
    isLoading,
    isSending,
    isWaitingForResponse,
    conversationTitle,
    conversations,
    isLoadingHistory,
    viewportRef,

    // Actions
    setInputValue,
    handleSendMessage,
    handleDeleteConversation,
    loadConversationHistory,
  };
};
