import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ActionIcon, Box, Text, TextInput } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowLeft, IconPencil } from '@tabler/icons-react';
import { createConversation } from '@/api/conversationApi';
import { getUrl } from '@/constants/urls';
import { useChat } from '@/components/ChatDrawer/useChat';
import { ChatMessageList } from '@/components/ChatDrawer/ChatMessageList';
import { ChatInput } from '@/components/ChatDrawer/ChatInput';
import { ChatEmptyState } from '@/components/ChatDrawer/ChatEmptyState';
import { AssistantMark } from '@/components/ChatDrawer/AssistantMark';
import { ChatConversationRail } from './ChatConversationRail';

const READING_WIDTH = 760;

interface PaneHeaderProps {
  title: string;
  onRename: (_title: string) => void;
  onBack?: () => void;
}

function PaneHeader({ title, onRename, onBack }: PaneHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  useEffect(() => {
    setDraft(title);
  }, [title]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title) onRename(trimmed);
    else setDraft(title);
  };

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 20px',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        background: 'var(--mantine-color-body)',
      }}
    >
      {onBack && (
        <ActionIcon variant="subtle" color="gray" onClick={onBack} aria-label="Back to conversations">
          <IconArrowLeft size={18} />
        </ActionIcon>
      )}
      <AssistantMark size={18} />
      {editing ? (
        <TextInput
          autoFocus
          value={draft}
          variant="unstyled"
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              setEditing(false);
              setDraft(title);
            }
          }}
          onBlur={commit}
          styles={{ input: { fontSize: 18, fontWeight: 600 } }}
          style={{ flex: 1 }}
        />
      ) : (
        <Text
          fw={600}
          size="lg"
          truncate
          style={{ flex: 1, cursor: 'text' }}
          onClick={() => setEditing(true)}
          title="Rename conversation"
        >
          {title}
        </Text>
      )}
      <ActionIcon
        variant="subtle"
        color="gray"
        onClick={() => setEditing(true)}
        aria-label="Rename conversation"
      >
        <IconPencil size={16} />
      </ActionIcon>
    </Box>
  );
}

/**
 * Full-page AI chat: a conversation rail on the left and a roomy, bubbleless
 * conversation pane on the right. The selected conversation lives in the URL
 * (`/chat/:conversationId`), so it's linkable and the drawer can hand off here.
 */
const ChatPage = () => {
  const { conversationId } = useParams();
  const id = conversationId ?? null;
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const goToList = () => navigate(getUrl('chat').path());
  const goToConversation = (cid: string) =>
    navigate(getUrl('chatConversation').path(cid));

  const chat = useChat({
    conversationId: id,
    isActive: true,
    onConversationChange: (cid) => (cid ? goToConversation(cid) : goToList()),
  });

  const { loadConversationHistory, submitMessage } = chat;

  // Keep the rail populated even while a conversation is open.
  useEffect(() => {
    loadConversationHistory();
  }, [loadConversationHistory]);

  // When arriving with a seeded prompt (from the landing empty state), send it
  // once the new conversation is active, then clear the navigation state.
  useEffect(() => {
    const seed = (location.state as { seed?: string } | null)?.seed;
    if (id && seed) {
      submitMessage(seed);
      navigate(getUrl('chatConversation').path(id), { replace: true, state: {} });
    }
  }, [id, location.state, submitMessage, navigate]);

  const handleNewChat = async () => {
    try {
      const conversation = await createConversation();
      await loadConversationHistory();
      goToConversation(conversation.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  // From the landing empty state: create, then seed the first message.
  const handleSeedNewChat = async (text: string) => {
    try {
      const conversation = await createConversation();
      loadConversationHistory();
      navigate(getUrl('chatConversation').path(conversation.id), { state: { seed: text } });
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const showRail = !isMobile || !id;
  const showPane = !isMobile || !!id;

  return (
    <Box style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      {showRail && (
        <ChatConversationRail
          conversations={chat.conversations}
          isLoading={chat.isLoadingHistory && chat.conversations.length === 0}
          activeConversationId={id}
          onSelectConversation={goToConversation}
          onDeleteConversation={chat.handleDeleteConversation}
          onRenameConversation={chat.handleRenameConversation}
          onNewChat={handleNewChat}
          width={isMobile ? '100%' : 300}
        />
      )}

      {showPane &&
        (id ? (
          <Box style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <PaneHeader
              title={chat.conversationTitle || 'New chat'}
              onRename={(title) => chat.handleRenameConversation(id, title)}
              onBack={isMobile ? goToList : undefined}
            />
            <ChatMessageList
              messages={chat.messages}
              isLoading={chat.isLoading}
              isWaitingForResponse={chat.isWaitingForResponse}
              viewportRef={chat.viewportRef}
              onRegenerate={chat.handleRegenerate}
              contentMaxWidth={READING_WIDTH}
              emptyState={
                <ChatEmptyState
                  onSelectPrompt={(text) => chat.submitMessage(text)}
                  greeting="Start the conversation"
                />
              }
            />
            <ChatInput
              value={chat.inputValue}
              onChange={chat.setInputValue}
              onSend={chat.handleSendMessage}
              disabled={chat.isSending || chat.isLoading}
              contentMaxWidth={READING_WIDTH}
              autoFocus
            />
          </Box>
        ) : (
          <Box
            className="chat-surface"
            style={{ flex: 1, minWidth: 0, overflowY: 'auto', display: 'flex' }}
          >
            <ChatEmptyState
              onSelectPrompt={handleSeedNewChat}
              greeting="What can I help you find?"
            />
          </Box>
        ))}
    </Box>
  );
};

export default ChatPage;
