import { useState, useEffect, ReactNode } from 'react'
import {
  Burger,
  useMantineTheme,
  Group,
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

const HEADER_HEIGHT = 40;

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const theme = useMantineTheme()
  const [opened, setOpened] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // sm breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const navigationData = [
    { icon: IconHome, label: 'Dashboard', href: '/', color: 'blue' },
    { icon: IconUsers, label: 'Users', href: '/users', color: 'green' },
    { icon: IconChartBar, label: 'Analytics', href: '/analytics', color: 'orange' },
    { icon: IconFileText, label: 'Documents', href: '/documents', color: 'purple' },
    { icon: IconMail, label: 'Messages', href: '/messages', color: 'cyan' },
  ]

  return (
    <div>
      {/* Full-width header */}
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000,
          height: HEADER_HEIGHT,
          padding: theme.spacing.md,
          background: theme.colors.gray[0],
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Burger
          opened={opened}
          onClick={() => setOpened((o) => !o)}
          size="sm"
          color={theme.colors.gray[6]}
          mr="xl"
          hiddenFrom="sm"
        />

        <Group style={{ flex: 1 }} justify="space-between">
          
        </Group>
      </div>

      {/* Content area with navbar */}
      <div style={{ 
        display: 'flex', 
        marginTop: HEADER_HEIGHT,
        background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
        height: `calc(100vh - ${HEADER_HEIGHT}px)`
      }}>
        {/* Left navbar */}
        <div 
          style={{ 
            width: isMobile ? (opened ? 200 : 0) : 250,
            minWidth: isMobile ? (opened ? 200 : 0) : 250,
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            background: theme.colors.gray[0],
            padding: theme.spacing.md
          }}
        >
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

          <Divider my="sm" />

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
        </div>

        {/* Main content */}
        <div className="flex-1 h-full bg-white w-full p-4 rounded-lg border border-gray-200 shadow-md mr-4 mb-4">
          {children}
        </div>
      </div>
    </div>
  )
}

