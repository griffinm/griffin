import { useContext } from 'react';
import { Avatar, Menu, Text, UnstyledButton } from '@mantine/core';
import { IconSettings, IconLogout, IconSelector } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '@/providers/UserProvider/UserContext';
import { getUrl } from '@/constants/urls';
import { getInitials } from '@/utils/getInitials';

interface SidebarProfileProps {
  collapsed: boolean;
}

/**
 * Footer identity chip for the sidebar. Shows the current user (avatar +
 * name/email) and opens a menu with Settings / Logout. Collapses to an
 * avatar-only target when the sidebar is in icon-rail mode.
 */
export function SidebarProfile({ collapsed }: SidebarProfileProps) {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const initials = getInitials(user?.firstName, user?.email);
  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Account';
  const email = user?.email ?? '';

  const handleLogout = async () => {
    try {
      await logout();
      navigate(getUrl('login').path(), { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Menu
      position={collapsed ? 'right-end' : 'top-start'}
      width={collapsed ? 200 : 'target'}
      shadow="md"
      withinPortal
    >
      <Menu.Target>
        {collapsed ? (
          <UnstyledButton
            aria-label="Account menu"
            className="flex w-full justify-center rounded-md py-1.5 transition-colors hover:bg-[var(--mantine-color-default-hover)]"
          >
            <Avatar color="teal" radius="xl" size={32}>
              {initials}
            </Avatar>
          </UnstyledButton>
        ) : (
          <UnstyledButton className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--mantine-color-default-hover)]">
            <Avatar color="teal" radius="xl" size={32}>
              {initials}
            </Avatar>
            <div className="min-w-0 flex-1 text-left">
              <Text size="sm" fw={500} truncate>
                {displayName}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {email}
              </Text>
            </div>
            <IconSelector size={16} className="shrink-0 text-[var(--mantine-color-dimmed)]" />
          </UnstyledButton>
        )}
      </Menu.Target>
      <Menu.Dropdown>
        {collapsed && (
          <>
            <Menu.Label>
              <span className="block max-w-[170px] truncate">{displayName}</span>
            </Menu.Label>
            <Menu.Divider />
          </>
        )}
        <Menu.Item
          leftSection={<IconSettings size={16} stroke={1.5} />}
          onClick={() => navigate(getUrl('settings').path())}
        >
          Settings
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} stroke={1.5} />}
          onClick={handleLogout}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
