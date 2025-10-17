import { ComponentType } from 'react';
import { LogInPage } from '../pages/LogInPage';
import { NoAuthLayout } from '../layouts/NoAuthLayout';
import { APP_NAME } from './globals';

function pageTitle(pageName?: string) {
  if (!pageName) return APP_NAME;
  return `${pageName} | ${APP_NAME}`;
}

export interface Url {
  path: (...args: any[]) => string;
  urlTemplate: string;
  pageComponent: ComponentType;
  title?: string;
  layoutComponent: ComponentType;
}

export const urls: Url[] = [
  {
    path: () => '/login',
    urlTemplate: '/login',
    pageComponent: LogInPage,
    title: pageTitle('Log In'),
    layoutComponent: NoAuthLayout
  }
];
