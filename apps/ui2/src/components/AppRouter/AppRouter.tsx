import { createBrowserRouter, RouteObject } from "react-router-dom";
import React, { Suspense } from "react";
import { urls } from "../../constants/urls";

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px'
  }}>
    Loading...
  </div>
);

// Create routes with proper nested layout structure
function buildRoutes(): RouteObject[] {
  return urls.map(url => {
    const LayoutComponent = url.layoutComponent;
    const PageComponent = url.pageComponent;
    
    return {
      path: url.path(),
      element: <LayoutComponent />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<LoadingFallback />}>
              <PageComponent />
            </Suspense>
          ),
        }
      ]
    };
  });
}

export const router = createBrowserRouter(buildRoutes());
