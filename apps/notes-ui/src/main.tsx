import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Router, RouterProvider, Routes } from "react-router-dom";
import { UserProvider } from './providers/UserProvider';
import { NoteProvider } from './providers/NoteProvider';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Layout } from './components/Layout';
import { Note } from './components/Note';
import { TaskProvider } from './providers/TaskProvider';
import { NewTaskPage } from './pages/NewTaskPage';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <NoteProvider>
          <TaskProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route path="notes/:noteId" element={<Note />} />
                <Route path="tasks/new" element={<NewTaskPage />} />
                <Route path="tasks/:taskId" element={<NewTaskPage />} />
              </Route>
            </Routes>
          </TaskProvider>
        </NoteProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);
