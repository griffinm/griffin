import { createBrowserRouter, RouteObject } from "react-router-dom";
import React from "react";
import { urls, type Url } from "../../constants/urls";

// Group URLs by layout to create nested route structure
function buildRoutes(): RouteObject[] {
  // Group by layout component
  interface LayoutGroup {
    layoutComponent: React.ComponentType;
    urls: Url[];
  }
  
  const layoutGroups: Record<string, LayoutGroup> = {};
  let layoutKeyCounter = 0;

  // Group URLs by their layout component
  urls.forEach((url) => {
    const LayoutComponent = (url as any).layoutComponent;
    // Find existing group with same layout component
    let found = false;
    for (const key in layoutGroups) {
      if (layoutGroups[key].layoutComponent === LayoutComponent) {
        layoutGroups[key].urls.push(url);
        found = true;
        break;
      }
    }
    if (!found) {
      const newKey = `layout_${layoutKeyCounter++}`;
      layoutGroups[newKey] = { layoutComponent: LayoutComponent, urls: [url] };
    }
  });

  // Create nested routes for each layout group
  const routes: RouteObject[] = Object.values(layoutGroups).map(({ layoutComponent: LayoutComponent, urls: urlsForLayout }) => ({
    path: "/",
    element: <LayoutComponent />,
    children: urlsForLayout.map(url => {
      const PageComponent = (url as any).pageComponent;
      return {
        path: url.path(),
        element: <PageComponent />,
      };
    })
  }));

  return routes;
}

export const router = createBrowserRouter(buildRoutes());
