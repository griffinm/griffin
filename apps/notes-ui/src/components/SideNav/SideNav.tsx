import { NotebookList } from '../NotebookList'
import { useNotes } from '../../providers/NoteProvider'
import { NoteList } from '../NoteList'
import { Search } from '../Search'
import classnames from 'classnames'
import { useUser } from '../../providers/UserProvider'
import { Button, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import { Link } from 'react-router-dom';
import { urls } from '../../utils/urls';
import { Add, CheckBox } from '@mui/icons-material'
import { useTasks } from '../../providers/TaskProvider';
import { useToast } from '../../providers/ToastProvider';
import { useRef, useEffect } from 'react';

interface Props {
  menuExpanded: boolean;
  onClose?: () => void;
}

export function SideNav({ menuExpanded, onClose }: Props) {
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
  
  const containerClasses = classnames(
    "flex flex-row md:min-h-[450px]", {
      "w-full md:w-[450px]": currentNotebook,
      "w-full md:w-[225px]": !currentNotebook,
    }
  );

  const sideNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuExpanded) return;
    function handleClickOutside(event: MouseEvent) {
      if (sideNavRef.current && !sideNavRef.current.contains(event.target as Node)) {
        onClose && onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuExpanded, onClose]);

  const renderSearch = () => {
    return (
      <div className="flex flex-row p-2 md:p-3">
        <Search />
      </div>
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
      <div className="flex flex-col justify-end">
        <div className="p-3 border-b border-slate-700">
          Signed in as:
          <div className="pb-3">
            <Link to={urls.profile}>
              {user?.firstName}
            </Link>
          </div>
        </div>
        <div className="p-5 text-center">
          <Button sx={{ color: 'white' }} onClick={signOut} startIcon={<LogoutIcon />}>
            Sign Out
          </Button>
        </div>
      </div>
    )
  }

  const renderContentLists = () => {
    return (
      <div className="flex flex-col grow bg-dark-1">
        <List
          sx={{ width: '100%', flexGrow: 1 }}
          component="nav"
        >
          {renderStaticButtons()}
          <div className="flex grow">
            <NotebookList />
          </div>
        </List>
      </div>
    )
  }

  const renderActions = () => {
    if (!defaultNotebook) return null;

    return (
      <div className="m-3 flex flex-col md:flex-row gap-2 md:gap-4">
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
      </div>
    )
  }

  return (
    <div ref={sideNavRef} className={containerClasses}>
      <div className="flex flex-col h-screen md:min-w-[225px]">
        {renderSearch()}
        {renderActions()}
        <div className="overflow-y-scroll overflow-x-wrap no-scrollbar grow">
          {renderContentLists()}
        </div>

        {renderAccountButton()}
        
      </div>

      {currentNotebook && (
        <div className="border-l-2 border-slate-700 w-[225px] sticky top-0 bottom-0">
          <NoteList />
        </div>
      )}
    </div>
  )
}
