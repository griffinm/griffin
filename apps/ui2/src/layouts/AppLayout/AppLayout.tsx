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
import { useMediaQuery } from '@mantine/hooks'
import {
  IconSettings,
  IconLogout,
  IconHome,
  IconCheck,
} from '@tabler/icons-react'
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { UserContext } from '@/providers/UserProvider/UserContext';
import { getUrl } from '@/constants/urls';
import { NoteTree } from '@/views/NoteTree';
import { Search } from '@/components/Search/Search';

const HEADER_HEIGHT = 40;
const LEFT_NAVBAR_WIDTH_DESKTOP = 250;

export const AppLayout = () => {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [opened, setOpened] = useState(true)
  const { user, loading, logout } = useContext(UserContext)
  const navigate = useNavigate()
  const location = useLocation()

  // Close navbar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setOpened(false)
    }
  }, [location.pathname, isMobile])

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
          zIndex: 100,
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
          <Search />
        </Group>
      </div>

      {/* Content area with navbar */}
      <div style={{ 
        display: 'flex', 
        marginTop: HEADER_HEIGHT,
        background: theme.colors.gray[0],
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
              zIndex: 9,
            }}
          />
        )}

        {/* Left navbar */}
        <div 
          style={{ 
            position: isMobile ? 'fixed' : 'relative',
            top: isMobile ? HEADER_HEIGHT : 'auto',
            left: isMobile ? (opened ? 0 : -LEFT_NAVBAR_WIDTH_DESKTOP) : 'auto',
            width: isMobile ? 200 : (opened ? LEFT_NAVBAR_WIDTH_DESKTOP : 0),
            minWidth: isMobile ? 200 : (opened ? LEFT_NAVBAR_WIDTH_DESKTOP : 0),
            transition: isMobile ? 'left 0.3s ease' : 'width 0.3s ease',
            overflow: 'hidden',
            background: theme.colors.gray[0],
            padding: opened ? '15px' : 0,
            display: 'flex',
            flexDirection: 'column',
            height: isMobile ? `calc(100vh - ${HEADER_HEIGHT}px)` : '100%',
            zIndex: 10,
            boxShadow: isMobile && opened ? '2px 0 8px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Stack gap="xs" style={{ overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
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
            <Divider my="sm" />
          </Stack>

          <Stack gap="xs" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
            <NoteTree />
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
          className="flex-1 bg-white w-full rounded-lg border border-gray-200 shadow-md sm:mr-4 mb-4"
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

