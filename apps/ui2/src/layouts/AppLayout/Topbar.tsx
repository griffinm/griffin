import {
  ActionIcon,
  Burger,
  Group,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMessagePlus,
  IconMicrophone,
} from '@tabler/icons-react';
import { Search } from '@/components/Search/Search';
import { TabBar } from '@/components/TabBar';

interface TopbarProps {
  height: number;
  isMobile: boolean;
  /** Mobile: drawer open. Desktop: ignored (rail uses `collapsed`). */
  opened: boolean;
  /** Desktop: sidebar collapsed to icon rail. */
  collapsed: boolean;
  onToggle: () => void;
  onOpenChat: () => void;
  onOpenTranscription: () => void;
}

/**
 * Fixed application header: sidebar toggle + wordmark on the left, search and
 * open-note tabs in the middle, and unified neutral action icons on the right.
 */
export function Topbar({
  height,
  isMobile,
  opened,
  collapsed,
  onToggle,
  onOpenChat,
  onOpenTranscription,
}: TopbarProps) {
  const theme = useMantineTheme();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height,
        paddingInline: isMobile ? theme.spacing.sm : theme.spacing.md,
        background: 'var(--mantine-color-body)',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? theme.spacing.xs : theme.spacing.md,
      }}
    >
      {/* Left: sidebar toggle */}
      <div style={{ flexShrink: 0 }}>
        {isMobile ? (
          <Burger opened={opened} onClick={onToggle} size="sm" color={theme.colors.gray[6]} />
        ) : (
          <Tooltip
            label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            openDelay={300}
            withArrow
          >
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={onToggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <IconLayoutSidebarLeftExpand size={20} stroke={1.5} />
              ) : (
                <IconLayoutSidebarLeftCollapse size={20} stroke={1.5} />
              )}
            </ActionIcon>
          </Tooltip>
        )}
      </div>

      {/* Middle: search + open-note tabs */}
      <Group style={{ flex: 1, minWidth: 0 }} gap="md" wrap="nowrap">
        <div
          style={{
            flex: '0 0 auto',
            minWidth: isMobile ? 100 : 240,
            maxWidth: isMobile ? 'none' : 480,
          }}
        >
          <Search />
        </div>
        {!isMobile && (
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <TabBar />
          </div>
        )}
      </Group>

      {/* Right: unified action icons */}
      <Group gap="2xs" wrap="nowrap" style={{ flexShrink: 0 }}>
        <Tooltip label="Chat" openDelay={300} withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={onOpenChat}
            aria-label="Chat"
          >
            <IconMessagePlus size={20} stroke={1.5} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Voice transcription" openDelay={300} withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={onOpenTranscription}
            aria-label="Voice transcription"
          >
            <IconMicrophone size={20} stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </div>
  );
}
