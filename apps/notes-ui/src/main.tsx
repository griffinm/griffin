import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from "react-router-dom";
import { router } from './router';
import { UserProvider } from './providers/UserProvider/UserProvider';
import { CurrentNoteProvider } from './providers/CurrentNoteProvider/CurrentNoteProvider';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <UserProvider>
      <CurrentNoteProvider>
        <RouterProvider router={router} />
      </CurrentNoteProvider>
    </UserProvider>
  </StrictMode>
);
