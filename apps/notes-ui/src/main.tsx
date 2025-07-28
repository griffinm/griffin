import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Layout } from './components/Layout';
import { Note } from './components/Note';
import { Home } from './pages/Home';
import { ThemeOptions } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { TaskPage } from './pages/Tasks';
import { Providers } from './providers/Providers';
import { Profile } from './pages/Profile';
import { TabContainer } from './components/TabContainer';

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
        <Providers>
          <Routes>
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/" element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/tasks" element={<TaskPage />} />
              <Route path="notes/:noteId" element={<Note />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tab-container" element={<TabContainer />} />
            </Route>
          </Routes>
        </Providers>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
