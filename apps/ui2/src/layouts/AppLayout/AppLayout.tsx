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
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { UserContext } from '@/providers/UserProvider/UserContext';
import { getUrl } from '@/constants/urls';

const HEADER_HEIGHT = 40;

export const AppLayout = () => {
  const theme = useMantineTheme()
  const [opened, setOpened] = useState(true)
  const { user, loading, logout } = useContext(UserContext)
  const navigate = useNavigate()
  const location = useLocation()

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
            width: opened ? 200 : 0,
            minWidth: opened ? 200 : 0,
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            background: theme.colors.gray[0],
            padding: opened ? '15px' : 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          <Stack gap="xs" style={{ flex: 1 }}>
            {navigationData.map((item) => {
              const isActive = location.pathname === item.path
              return (
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
                    active={isActive}
                    component="div"
                    styles={{
                      root: {
                        borderRadius: theme.radius.sm,
                      },
                    }}
                  />
                </Link>
              )
            })}
          </Stack>

          <Divider my="sm" />

          <Stack gap="xs">
            <Link to="/settings" style={{ textDecoration: 'none' }}>
              <NavLink
                label="Settings"
                leftSection={<IconSettings size="1rem" stroke={1.5} />}
                active={location.pathname === '/settings'}
                component="div"
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
        <div 
          className="flex-1 bg-white w-full p-4 rounded-lg border border-gray-200 shadow-md mr-4 mb-4"
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
      </div>
    </div>
  )
}

