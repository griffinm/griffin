import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import { Home } from './pages/Home';
import { ThemeOptions } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';

export const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <ThemeProvider theme={createTheme(themeOptions)}>
      <BrowserRouter>
        <UserProvider>
          <NoteProvider>
            <TaskProvider>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="notes/:noteId" element={<Note />} />
                  <Route path="tasks/new" element={<NewTaskPage />} />
                  <Route path="tasks/:taskId" element={<NewTaskPage />} />
                </Route>
              </Routes>
            </TaskProvider>
          </NoteProvider>
        </UserProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
