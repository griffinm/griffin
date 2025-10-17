import { ComponentType } from 'react';
import { LogInPage } from '../pages/LogInPage';
import { NoAuthLayout } from '../layouts/NoAuthLayout';
import { APP_NAME } from './globals';

function pageTitle(pageName?: string) {
  if (!pageName) return APP_NAME;
  return `${pageName} | ${APP_NAME}`;
}

export type UrlName = 'login';

export interface Url {
  name: UrlName;
  path: (...args: any[]) => string;
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
  }
];

export function getUrl(name: UrlName): Url {
  const url = urls.find(url => url.name === name);
  if (!url) {
    throw new Error(`Url ${name} not found`);
  }

  return url;
}
