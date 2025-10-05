import { useState } from 'react'
import {
  AppShell,
  Text,
  Burger,
  useMantineTheme,
  Group,
  Avatar,
  Menu,
  UnstyledButton,
  rem,
  NavLink,
  Stack,
  Divider,
  Badge,
} from '@mantine/core'
import {
  IconDashboard,
  IconUsers,
  IconSettings,
  IconLogout,
  IconChevronDown,
  IconBell,
  IconSearch,
  IconHome,
  IconChartBar,
  IconFileText,
  IconMail,
} from '@tabler/icons-react'

const Layout = ({ children }) => {
  const theme = useMantineTheme()
  const [opened, setOpened] = useState(false)

  const navigationData = [
    { icon: IconHome, label: 'Dashboard', href: '/', color: 'blue' },
    { icon: IconUsers, label: 'Users', href: '/users', color: 'green' },
    { icon: IconChartBar, label: 'Analytics', href: '/analytics', color: 'orange' },
    { icon: IconFileText, label: 'Documents', href: '/documents', color: 'purple' },
    { icon: IconMail, label: 'Messages', href: '/messages', color: 'cyan' },
  ]

  const UserButton = () => (
    <UnstyledButton
      style={{
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
        '&:hover': {
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        },
      }}
    >
      <Group>
        <Avatar
          src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-8.png"
          radius="xl"
        />
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
            John Doe
          </Text>
          <Text c="dimmed" size="xs">
            john@example.com
          </Text>
        </div>
        <IconChevronDown style={{ width: rem(14), height: rem(14) }} />
      </Group>
    </UnstyledButton>
  )

  return (
    <AppShell
      styles={{
        main: {
          background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      navbar={
        <AppShell.Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{ sm: 200, lg: 300 }}>
          <AppShell.Section grow>
            <Stack gap="xs">
              {navigationData.map((item) => (
                <NavLink
                  key={item.label}
                  href={item.href}
                  label={item.label}
                  leftSection={<item.icon size="1rem" stroke={1.5} />}
                  rightSection={
                    item.label === 'Messages' && (
                      <Badge size="xs" color="red" variant="filled">
                        3
                      </Badge>
                    )
                  }
                  styles={{
                    root: {
                      borderRadius: theme.radius.sm,
                    },
                  }}
                />
              ))}
            </Stack>
          </AppShell.Section>

          <Divider my="sm" />

          <AppShell.Section>
            <Stack gap="xs">
              <NavLink
                href="/settings"
                label="Settings"
                leftSection={<IconSettings size="1rem" stroke={1.5} />}
              />
              <NavLink
                href="/logout"
                label="Logout"
                leftSection={<IconLogout size="1rem" stroke={1.5} />}
                color="red"
              />
            </Stack>
          </AppShell.Section>
        </AppShell.Navbar>
      }
      header={
        <AppShell.Header height={{ base: 50, md: 70 }} p="md">
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              size="sm"
              color={theme.colors.gray[6]}
              mr="xl"
              hiddenFrom="sm"
            />

            <Group style={{ flex: 1 }} justify="space-between">
              <Group>
                <Text size="xl" fw={700} className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  UI2 Dashboard
                </Text>
              </Group>

              <Group gap="sm">
                <UnstyledButton
                  style={{
                    padding: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
                    '&:hover': {
                      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                    },
                  }}
                >
                  <IconSearch size="1.2rem" />
                </UnstyledButton>

                <UnstyledButton
                  style={{
                    padding: theme.spacing.xs,
                    borderRadius: theme.radius.sm,
                    color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
                    '&:hover': {
                      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                    },
                  }}
                >
                  <IconBell size="1.2rem" />
                </UnstyledButton>

                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <UserButton />
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Application</Menu.Label>
                    <Menu.Item leftSection={<IconDashboard size={14} />}>
                      Dashboard
                    </Menu.Item>
                    <Menu.Item leftSection={<IconSettings size={14} />}>
                      Settings
                    </Menu.Item>

                    <Menu.Divider />

                    <Menu.Label>Danger zone</Menu.Label>
                    <Menu.Item color="red" leftSection={<IconLogout size={14} />}>
                      Logout
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>
          </div>
        </AppShell.Header>
      }
    >
      {children}
    </AppShell>
  )
}

export default Layout
