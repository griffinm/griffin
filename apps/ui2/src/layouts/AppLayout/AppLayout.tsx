import { useState, useEffect, useContext } from 'react'
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
  IconSettings,
  IconLogout,
  IconHome,
  IconCheck,
} from '@tabler/icons-react'
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { UserContext } from '@/providers/UserProvider/UserContext';
import { getUrl } from '@/constants/urls';

const HEADER_HEIGHT = 40;

export const AppLayout = () => {
  const theme = useMantineTheme()
  const [opened, setOpened] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { user, loading, logout } = useContext(UserContext)
  const navigate = useNavigate()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // sm breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      navigate(getUrl('login').path(), { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate(getUrl('login').path(), { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navigationData = [
    { icon: IconHome, label: 'Dashboard', path: getUrl('dashboard').path(), color: 'blue' },
    { icon: IconCheck, label: 'Tasks', path: getUrl('tasks').path(), color: 'green' },
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
        background: theme.colors.gray[0],
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
              <Link key={item.label} to={item.path} style={{ textDecoration: 'none' }}>
                <NavLink
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
              </Link>
            ))}
          </Stack>

          <Divider my="sm" />

          <Stack gap="xs">
            <Link to="/settings" style={{ textDecoration: 'none' }}>
              <NavLink
                label="Settings"
                leftSection={<IconSettings size="1rem" stroke={1.5} />}
              />
            </Link>
            <NavLink
              onClick={handleLogout}
              label="Logout"
              leftSection={<IconLogout size="1rem" stroke={1.5} />}
              color="red"
            />
          </Stack>
        </div>

        {/* Main content */}
        <div className="flex-1 h-full bg-white w-full p-4 rounded-lg border border-gray-200 shadow-md mr-4 mb-4">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

