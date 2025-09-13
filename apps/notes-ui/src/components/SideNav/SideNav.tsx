import { NotebookList } from '../NotebookList'
import { useNotes } from '../../providers/NoteProvider'
import { NoteList } from '../NoteList'
import { Search } from '../Search'
import { useUser } from '../../providers/UserProvider'
import { Button, List, ListItemButton, ListItemIcon, ListItemText, Box, Divider } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import { Link } from 'react-router-dom';
import { urls } from '../../utils/urls';
import { Add, CheckBox } from '@mui/icons-material'
import { useTasks } from '../../providers/TaskProvider';
import { useToast } from '../../providers/ToastProvider';
import { useRef, useEffect } from 'react';

interface Props {
  onClose?: () => void;
}

export function SideNav({ onClose }: Props) {
  const { user, signOut } = useUser();
  const { showMessage } = useToast();
  const {
    currentNotebook,
    createNote,
    defaultNotebook,
  } = useNotes();
  const { 
    showNewTaskModal,
  } = useTasks();
  
  const sideNavRef = useRef<HTMLDivElement>(null);

  const renderSearch = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Search />
      </Box>
    )
  }

  const renderStaticButtons = () => {
    return (
      <>
        <Link to={urls.home}>
          <ListItemButton>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </Link>
        <Link to={urls.tasks}>
          <ListItemButton>
            <ListItemIcon>
              <CheckBox />
            </ListItemIcon>
            <ListItemText primary="Tasks" />
          </ListItemButton>
        </Link>
      </>
    )
  }

  const renderAccountButton = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          Signed in as:
          <Box sx={{ pb: 2 }}>
            <Link to={urls.profile}>
              {user?.firstName}
            </Link>
          </Box>
        </Box>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Button sx={{ color: 'white' }} onClick={signOut} startIcon={<LogoutIcon />}>
            Sign Out
          </Button>
        </Box>
      </Box>
    )
  }

  const renderContentLists = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <List
          sx={{ width: '100%', flexGrow: 1 }}
          component="nav"
        >
          {renderStaticButtons()}
          <Box sx={{ flexGrow: 1 }}>
            <NotebookList />
          </Box>
        </List>
      </Box>
    )
  }

  const renderActions = () => {
    if (!defaultNotebook) return null;

    return (
      <Box sx={{ m: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => {
            createNote(defaultNotebook.id);
            showMessage('Note created');
          }}
          fullWidth
        >
          Note
        </Button>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => showNewTaskModal()}
          fullWidth
        >
          Task
        </Button>
      </Box>
    )
  }

  return (
    <Box 
      ref={sideNavRef} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'row',
        height: '100%',
        width: '100%'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'calc(100vh - 64px)', // Height minus AppBar height
        width: 'fit-content',
        minWidth: 'max-content'
      }}>
        {renderSearch()}
        {renderActions()}
        <Box sx={{ 
          overflowY: 'auto', 
          overflowX: 'hidden',
          flexGrow: 1,
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none'
        }}>
          {renderContentLists()}
        </Box>
        {renderAccountButton()}
      </Box>

      {currentNotebook && (
        <Box sx={{ 
          borderLeft: 2, 
          borderColor: 'divider',
          width: 'fit-content',
          minWidth: 'max-content',
          position: 'sticky',
          top: 0,
          bottom: 0,
          height: 'calc(100vh - 64px)' // Height minus AppBar height
        }}>
          <NoteList />
        </Box>
      )}
    </Box>
  )
}
