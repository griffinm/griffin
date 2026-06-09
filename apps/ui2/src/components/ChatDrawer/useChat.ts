import { useState, useEffect, useRef, useCallback } from 'react';
import { getConversation, sendMessage, listConversations, deleteConversation, updateConversation } from '@/api/conversationApi';
import { AttachedNoteRef, ConversationItem, ConversationItemRole, ConversationWithItems } from '@/types/conversation';
import { notifications } from '@mantine/notifications';
import { useConversationPolling } from '@/hooks/useConversationPolling';

interface UseChatOptions {
  conversationId: string | null;
  isActive: boolean; // Whether the chat is visible (opened, pinned, or sidebar)
  onConversationChange?: (_conversationId: string) => void;
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
  // Kept current so polling callbacks (stored in refs) can target the right
  // conversation without a stale closure.
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

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
      // Reflect auto-generated titles in the conversation list without a reload.
      const id = conversationIdRef.current;
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
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
      const response = await listConversations(1, 100);
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

  // Core send used by the composer, suggested prompts, and regenerate.
  const submitMessage = useCallback(
    async (rawContent: string, attachedNotes: AttachedNoteRef[] = []) => {
      const userMessage = rawContent.trim();
      if (!userMessage || !conversationId || isSending) return;

      setInputValue('');
      setIsSending(true);
      setIsWaitingForResponse(true);

      const tempUserMessage: ConversationItem = {
        id: `temp-${Date.now()}`,
        conversationId,
        role: ConversationItemRole.USER,
        content: userMessage,
        // Show the attached-note chips immediately; the server response (which
        // also carries componentData) replaces this temp message shortly after.
        componentData: attachedNotes.length
          ? { type: 'attached-notes', data: attachedNotes }
          : undefined,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      try {
        const response = await sendMessage(
          conversationId,
          userMessage,
          attachedNotes.map((n) => n.id)
        );

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
    },
    [conversationId, isSending, startPolling]
  );

  const handleSendMessage = useCallback(
    (attachedNotes: AttachedNoteRef[] = []) => submitMessage(inputValue, attachedNotes),
    [submitMessage, inputValue]
  );

  // Best-effort regenerate: re-send the most recent user message as a new turn
  // (there is no dedicated regenerate endpoint).
  const handleRegenerate = useCallback(() => {
    if (isSending || isWaitingForResponse) return;
    const lastUser = [...messages]
      .reverse()
      .find((m) => m.role === ConversationItemRole.USER);
    if (lastUser?.content) submitMessage(lastUser.content);
  }, [messages, isSending, isWaitingForResponse, submitMessage]);

  const handleRenameConversation = useCallback(
    async (renamedConversationId: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      try {
        await updateConversation(renamedConversationId, trimmed);
        setConversations((prev) =>
          prev.map((c) => (c.id === renamedConversationId ? { ...c, title: trimmed } : c))
        );
        if (renamedConversationId === conversationId) {
          setConversationTitle(trimmed);
        }
      } catch (error) {
        console.error('Error renaming conversation:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to rename conversation',
          color: 'red',
        });
      }
    },
    [conversationId]
  );

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
    submitMessage,
    handleRegenerate,
    handleDeleteConversation,
    handleRenameConversation,
    loadConversationHistory,
  };
};
