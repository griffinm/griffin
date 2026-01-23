import { Menu, ActionIcon, Text, Badge, Group } from '@mantine/core';
import { IconChevronDown, IconX } from '@tabler/icons-react';
import { Tab as TabType } from '@/types/tabs';

interface OverflowMenuProps {
  tabs: TabType[];
  activeTabId: string | null;
  onTabClick: (_noteId: string) => void;
  onTabClose: (_noteId: string) => void;
}

export function OverflowMenu({ tabs, activeTabId, onTabClick, onTabClose }: OverflowMenuProps) {
  if (tabs.length === 0) return null;

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" size="sm">
          <Badge size="xs" circle color="gray">
            {tabs.length}
          </Badge>
          <IconChevronDown size={14} style={{ marginLeft: 2 }} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>More tabs</Menu.Label>
        {tabs.map((tab) => (
          <Menu.Item
            key={tab.noteId}
            onClick={() => onTabClick(tab.noteId)}
            rightSection={
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.noteId);
                }}
              >
                <IconX size={12} />
              </ActionIcon>
            }
          >
            <Group gap="xs">
              <Text
                size="sm"
                fw={activeTabId === tab.noteId ? 500 : 400}
                c={activeTabId === tab.noteId ? 'blue.7' : undefined}
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 140,
                }}
              >
                {tab.title}
              </Text>
            </Group>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
