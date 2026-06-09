import { useState, useEffect, useContext } from 'react'
import { useMediaQuery, useLocalStorage } from '@mantine/hooks'
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '@/providers/UserProvider/UserContext';
import { TabsProvider } from '@/providers/TabsProvider';
import { getUrl } from '@/constants/urls';
import { TranscriptionModal } from '@/components/TranscriptionModal';
import { ChatDrawer } from '@/components/ChatDrawer';
import { createConversation } from '@/api/conversationApi';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

const HEADER_HEIGHT = 52;
const SIDEBAR_WIDTH = 240;
const SIDEBAR_RAIL_WIDTH = 60;

export const AppLayout = () => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [opened, setOpened] = useState(false)
  const [collapsed, setCollapsed] = useLocalStorage({
    key: 'griffin-sidebar-collapsed',
    defaultValue: false,
  })
  const [transcriptionModalOpened, setTranscriptionModalOpened] = useState(false)
  const [chatDrawerOpened, setChatDrawerOpened] = useState(false)
  const [activeChatConversationId, setActiveChatConversationId] = useState<string | null>(null)
  const [isChatPinned, setIsChatPinned] = useState(false)
  const { user, loading } = useContext(UserContext)
  const navigate = useNavigate()
  const location = useLocation()

  // Close the mobile drawer when the route changes
  useEffect(() => {
    if (isMobile) {
      setOpened(false)
    }
  }, [location.pathname, isMobile])

  // Check for transcription URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('transcribe') === 'true') {
      setTranscriptionModalOpened(true);
      // Remove the parameter from URL
      searchParams.delete('transcribe');
      const newSearch = searchParams.toString();
      navigate(
        {
          pathname: location.pathname,
          search: newSearch ? `?${newSearch}` : '',
        },
        { replace: true }
      );
    }
  }, [location.search, location.pathname, navigate])

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      navigate(getUrl('login').path(), { replace: true });
    }
  }, [user, loading, navigate]);

  const handleToggle = () => {
    if (isMobile) {
      setOpened((o) => !o)
    } else {
      setCollapsed((c) => !c)
    }
  }

  const openChatDrawer = (conversationId: string | null = null) => {
    setActiveChatConversationId(conversationId);
    setChatDrawerOpened(true);
  };

  const closeChatDrawer = () => {
    setChatDrawerOpened(false);
    // Keep conversation ID for a moment to allow smooth closing animation
    setTimeout(() => setActiveChatConversationId(null), 300);
  };

  const handleOpenChat = () => {
    // Open drawer without conversation to show history
    openChatDrawer(null);
  };

  const handleCreateNewChat = async () => {
    try {
      // Create a new conversation (title will be auto-generated after first message)
      const conversation = await createConversation();

      // Open the chat drawer with the new conversation
      openChatDrawer(conversation.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const sidebarWidth = isMobile
    ? SIDEBAR_WIDTH
    : collapsed
      ? SIDEBAR_RAIL_WIDTH
      : SIDEBAR_WIDTH

  return (
    <TabsProvider>
    <div>
      <Topbar
        height={HEADER_HEIGHT}
        isMobile={!!isMobile}
        opened={opened}
        collapsed={collapsed}
        onToggle={handleToggle}
        onOpenChat={handleOpenChat}
        onOpenTranscription={() => setTranscriptionModalOpened(true)}
      />

      {/* Content area with navbar */}
      <div style={{
        display: 'flex',
        marginTop: HEADER_HEIGHT,
        background: 'var(--mantine-color-body)',
        minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        position: 'relative'
      }}>
        {/* Backdrop for mobile */}
        {isMobile && opened && (
          <div
            onClick={() => setOpened(false)}
            style={{
              position: 'fixed',
              top: HEADER_HEIGHT,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 59,
            }}
          />
        )}

        {/* Left navbar */}
        <div
          style={{
            position: isMobile ? 'fixed' : 'relative',
            top: isMobile ? HEADER_HEIGHT : 'auto',
            left: isMobile ? (opened ? 0 : -SIDEBAR_WIDTH) : 'auto',
            width: sidebarWidth,
            minWidth: sidebarWidth,
            flexShrink: 0,
            transition: isMobile ? 'left 0.25s ease' : 'width 0.2s ease',
            overflow: 'hidden',
            background: 'var(--mantine-color-body)',
            borderRight: isMobile ? 'none' : '1px solid var(--mantine-color-default-border)',
            height: isMobile ? `calc(100vh - ${HEADER_HEIGHT}px)` : '100%',
            zIndex: 60,
            boxShadow: isMobile && opened ? '2px 0 8px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <Sidebar collapsed={!isMobile && collapsed} />
        </div>

        {/* Main content */}
        <div
          className="flex-1 bg-[var(--mantine-color-body)] w-full rounded-lg shadow-md sm:mr-4 mb-4 main-content-area"
          style={{
            height: 'calc(100% - 1rem)',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE and Edge
          }}
        >
          <Outlet />
        </div>

        {/* Pinned chat sidebar */}
        {isChatPinned && (
          <ChatDrawer
            opened={true}
            onClose={closeChatDrawer}
            conversationId={activeChatConversationId}
            onPinChange={setIsChatPinned}
            renderAsSidebar={true}
            onConversationChange={openChatDrawer}
            onNewChat={handleCreateNewChat}
          />
        )}
      </div>

      <TranscriptionModal
        opened={transcriptionModalOpened}
        onClose={() => setTranscriptionModalOpened(false)}
        onOpenChat={openChatDrawer}
      />

      {/* Regular chat drawer (when not pinned) */}
      {!isChatPinned && (
        <ChatDrawer
          opened={chatDrawerOpened}
          onClose={closeChatDrawer}
          conversationId={activeChatConversationId}
          onPinChange={setIsChatPinned}
          onConversationChange={openChatDrawer}
          onNewChat={handleCreateNewChat}
        />
      )}
    </div>
    </TabsProvider>
  )
}
