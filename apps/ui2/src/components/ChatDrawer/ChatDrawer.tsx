import { useState, useEffect } from 'react';
import { Drawer, Stack, Box } from '@mantine/core';
import { useChat } from './useChat';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ChatMessageList } from './ChatMessageList';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import { ChatHistoryDrawer } from './ChatHistoryDrawer';

interface ChatDrawerProps {
  opened: boolean;
  onClose: () => void;
  conversationId: string | null;
  onPinChange?: (pinned: boolean) => void;
  renderAsSidebar?: boolean;
  onConversationChange?: (conversationId: string) => void;
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
  const [pinned, setPinned] = useState(false);
  const [historyDrawerOpened, setHistoryDrawerOpened] = useState(false);

  const isActive = opened || pinned || renderAsSidebar;

  const {
    messages,
    inputValue,
    isLoading,
    isSending,
    isWaitingForResponse,
    conversationTitle,
    conversations,
    isLoadingHistory,
    viewportRef,
    setInputValue,
    handleSendMessage,
    handleDeleteConversation,
    loadConversationHistory,
  } = useChat({
    conversationId,
    isActive,
    onConversationChange,
  });

  // Sync pinned state with renderAsSidebar prop
  useEffect(() => {
    if (renderAsSidebar && !pinned) {
      setPinned(true);
    } else if (!renderAsSidebar && pinned && !opened) {
      setPinned(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderAsSidebar]);

  const isDrawerOpen = pinned || opened;
  const headerTitle = conversationId ? (conversationTitle || 'New Chat') : 'Chat History';

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
    onConversationChange?.(selectedConversationId);
    setHistoryDrawerOpened(false);
  };

  // Render the main chat content (messages or history panel)
  const renderContent = () => {
    if (!conversationId) {
      return (
        <ChatHistoryPanel
          conversations={conversations}
          isLoading={isLoadingHistory}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewChat={onNewChat}
        />
      );
    }

    return (
      <Stack gap={0} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          isWaitingForResponse={isWaitingForResponse}
          viewportRef={viewportRef}
        />
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          disabled={isSending || isLoading}
        />
      </Stack>
    );
  };

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
            backgroundColor: 'var(--mantine-color-body)',
            borderLeft: '1px solid var(--mantine-color-default-border)',
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
            {renderContent()}
          </Box>
        </Box>

        <ChatHistoryDrawer
          opened={historyDrawerOpened}
          onClose={() => setHistoryDrawerOpened(false)}
          conversations={conversations}
          isLoading={isLoadingHistory}
          activeConversationId={conversationId}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
        />
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
          root: {
            padding: 0,
          },
          body: {
            height: 'calc(100% - 60px)',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
          },
          header: {
            borderBottom: '1px solid var(--mantine-color-default-border)',
            padding: 0,
          },
        }}
      >
        {renderContent()}
      </Drawer>

      <ChatHistoryDrawer
        opened={historyDrawerOpened}
        onClose={() => setHistoryDrawerOpened(false)}
        conversations={conversations}
        isLoading={isLoadingHistory}
        activeConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />
    </>
  );
};
