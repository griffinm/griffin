import { ComponentType, lazy } from 'react';
import { NoAuthLayout } from '../layouts/NoAuthLayout';
import { APP_NAME } from './globals';
import { AppLayout } from '@/layouts/AppLayout';

// Lazy load page components
const LogInPage = lazy(() => import('../pages/LogInPage').then(module => ({ default: module.LogInPage })));
const SignUpPage = lazy(() => import('../pages/SignUpPage').then(module => ({ default: module.SignUpPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage/DashboardPage').then(module => ({ default: module.DashboardPage })));
const TasksPage = lazy(() => import('@/pages/TasksPage/TasksPage'));
const NotebooksPage = lazy(() => import('@/pages/NotebooksPage/NotebooksPage').then(module => ({ default: module.NotebooksPage })));
const NotebookPage = lazy(() => import('@/pages/NotebookPage/NotebookPage'));
const CreateNotePage = lazy(() => import('@/pages/CreateNotePage').then(module => ({ default: module.CreateNotePage })));
const NotePage = lazy(() => import('@/pages/NotePage/NotePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(module => ({ default: module.SettingsPage })))

function pageTitle(pageName?: string) {
  if (!pageName) return APP_NAME;
  return `${pageName} | ${APP_NAME}`;
}

export type UrlName = 'login' | 'signup' | 'dashboard' | 'tasks' | 'notebooks' | 'notebook' | 'createNote' | 'note' | 'settings';

export interface Url {
  name: UrlName;
  path: (..._args: string[]) => string;
  urlTemplate: string;
  pageComponent: ComponentType;
  title?: string;
  layoutComponent: ComponentType;
}

export const urls: Url[] = [
  {
    name: 'login',
    path: () => '/login',
    urlTemplate: '/login',
    pageComponent: LogInPage,
    title: pageTitle('Log In'),
    layoutComponent: NoAuthLayout
  },
  {
    name: 'signup',
    path: () => '/signup',
    urlTemplate: '/signup',
    pageComponent: SignUpPage,
    title: pageTitle('Sign Up'),
    layoutComponent: NoAuthLayout
  },
  {
    name: 'dashboard',
    path: () => '/',
    urlTemplate: '/',
    pageComponent: DashboardPage,
    title: pageTitle('Dashboard'),
    layoutComponent: AppLayout
  },
  {
    name: 'tasks',
    path: () => '/tasks',
    urlTemplate: '/tasks',
    pageComponent: TasksPage,
    title: pageTitle('Tasks'),
    layoutComponent: AppLayout
  },
  {
    name: 'notebooks',
    path: () => '/notebooks',
    urlTemplate: '/notebooks',
    pageComponent: NotebooksPage,
    title: pageTitle('Notebooks'),
    layoutComponent: AppLayout
  },
  {
    name: 'notebook',
    path: (notebookId?: string) => notebookId ? `/notebooks/${notebookId}` : '/notebooks/:notebookId',
    urlTemplate: '/notebooks/:notebookId',
    pageComponent: NotebookPage,
    title: pageTitle('Notebook'),
    layoutComponent: AppLayout
  },
  {
    name: 'createNote',
    path: () => '/notes/new',
    urlTemplate: '/notes/new',
    pageComponent: CreateNotePage,
    title: pageTitle('Create Note'),
    layoutComponent: AppLayout
  },
  {
    name: 'note',
    path: (noteId?: string) => noteId ? `/notes/${noteId}` : '/notes/:noteId',
    urlTemplate: '/notes/:noteId',
    pageComponent: NotePage,
    title: pageTitle('Note'),
    layoutComponent: AppLayout
  },
  {
    name: 'settings',
    path: () => '/settings',
    urlTemplate: '/settings',
    pageComponent: SettingsPage,
    title: pageTitle('Settings'),
    layoutComponent: AppLayout
  }
];

export function getUrl(name: UrlName): Url {
  const url = urls.find(url => url.name === name);
  if (!url) {
    throw new Error(`Url ${name} not found`);
  }

  return url;
}
