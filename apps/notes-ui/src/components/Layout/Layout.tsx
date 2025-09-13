import { useState, useEffect, useRef } from 'react'
import { Outlet } from "react-router";
import { SideNav } from "../SideNav/SideNav";
import { useTasks } from '../../providers/TaskProvider';
import { useNotes } from '../../providers/NoteProvider';
import { TaskModal } from '../TaskModal';
import { CreateOrUpdateTaskProps } from '../../utils/api';
import { 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  CssBaseline,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

// Removed fixed drawer width - now content-based

export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { modalOpen, onModalClose, createTask, updateTask, taskToEdit } = useTasks();
  const { currentNote, setCurrentNoteId, currentNotebook } = useNotes();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentNote) {
      setDrawerOpen(false);
    }
  }, [currentNote]);

  useEffect(() => {
    if (!drawerOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setDrawerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [drawerOpen]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleTaskSubmit = (task: CreateOrUpdateTaskProps, isNew: boolean) => {
    if (isNew) {
      createTask(task);
    } else {
      if (taskToEdit?.id) {
        updateTask(task, taskToEdit.id);
      }
    }
    onModalClose();
  }

  const drawer = (
    <SideNav onClose={() => setDrawerOpen(false)} />
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="static"
        sx={{
          width: '100%',
          bgcolor: 'primary.dark'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Notes App
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
      
       <Box
         ref={drawerRef}
         component="nav"
         sx={{ flexShrink: 0 }}
       >
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 'auto',
              minWidth: 'fit-content',
              top: '64px', // Position below AppBar
              height: 'calc(100vh - 64px)' // Height minus AppBar height
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="persistent"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 'auto',
              minWidth: 'fit-content',
              top: '64px', // Position below AppBar
              height: 'calc(100vh - 64px)' // Height minus AppBar height
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            bgcolor: 'background.default',
            height: '100%',
            overflow: 'auto',
            minWidth: 0 // Allows content to shrink below its natural size
          }}
        >
          <Outlet />
        </Box>
      </Box>

      <TaskModal open={modalOpen} onClose={onModalClose} onSubmit={handleTaskSubmit} />
    </Box>
  )
}
