import type { ComponentType, CSSProperties, ReactNode } from 'react';
import { Divider, Tooltip } from '@mantine/core';
import {
  IconBook,
  IconCheck,
  IconHome,
  IconQuestionMark,
  IconTags,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { getUrl } from '@/constants/urls';
import { NoteTree } from '@/views/NoteTree';
import { SidebarProfile } from './SidebarProfile';

type IconComponent = ComponentType<{
  size?: number | string;
  stroke?: number;
  style?: CSSProperties;
}>;

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--mantine-color-dimmed)]">
      {children}
    </div>
  );
}

interface NavItemProps {
  icon: IconComponent;
  label: string;
  path: string;
  active: boolean;
  collapsed: boolean;
}

function NavItem({ icon: Icon, label, path, active, collapsed }: NavItemProps) {
  const accent = 'var(--mantine-color-teal-light-color)';
  return (
    <Tooltip label={label} position="right" withArrow openDelay={200} disabled={!collapsed}>
      <Link to={path} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          className={`flex items-center rounded-md transition-colors ${
            collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-2.5 py-2'
          } ${active ? '' : 'hover:bg-[var(--mantine-color-default-hover)]'}`}
          style={
            active
              ? {
                  background: 'var(--mantine-color-teal-light)',
                  boxShadow: collapsed ? undefined : 'inset 2px 0 0 var(--mantine-color-teal-filled)',
                }
              : undefined
          }
        >
          <Icon
            size={collapsed ? 21 : 18}
            stroke={1.5}
            style={{ color: active ? accent : 'var(--mantine-color-dimmed)' }}
          />
          {!collapsed && (
            <span
              className="text-sm"
              style={{
                color: active ? accent : 'var(--mantine-color-text)',
                fontWeight: active ? 500 : 400,
              }}
            >
              {label}
            </span>
          )}
        </div>
      </Link>
    </Tooltip>
  );
}

interface SidebarProps {
  collapsed: boolean;
}

/**
 * Left navigation. Expands to a labelled list with the notebook tree, or
 * collapses to an icon rail (tooltips on hover, tree hidden). The profile chip
 * sits pinned at the bottom in both states.
 */
export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();

  // Resolved at render time (not module load) to avoid a temporal-dead-zone
  // error from the urls.tsx <-> AppLayout circular import.
  const navItems: { icon: IconComponent; label: string; path: string }[] = [
    { icon: IconHome, label: 'Dashboard', path: getUrl('dashboard').path() },
    { icon: IconCheck, label: 'Tasks', path: getUrl('tasks').path() },
    { icon: IconBook, label: 'Notebooks', path: getUrl('notebooks').path() },
    { icon: IconTags, label: 'Tags', path: getUrl('tags').path() },
    { icon: IconQuestionMark, label: 'Questions', path: getUrl('questions').path() },
  ];

  return (
    <div className="flex h-full flex-col" style={{ padding: collapsed ? '10px 8px' : '12px' }}>
      {!collapsed && <SectionLabel>Workspace</SectionLabel>}
      <div className="flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={location.pathname === item.path}
            collapsed={collapsed}
          />
        ))}
      </div>

      {collapsed ? (
        <div className="flex-1" />
      ) : (
        <>
          <Divider my="sm" />
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <NoteTree />
          </div>
        </>
      )}

      <Divider my={collapsed ? '2xs' : 'xs'} />
      <SidebarProfile collapsed={collapsed} />
    </div>
  );
}
