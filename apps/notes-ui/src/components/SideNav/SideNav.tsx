import { NotebookList } from '../NotebookList'
import { TaskList } from '../TaskList'
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
import { Add } from '@mui/icons-material'

interface Props {
  menuExpanded: boolean;
}

export function SideNav({ menuExpanded }: Props) {
  const { user, signOut } = useUser();
  const containerClasses = classnames(
    "flex flex-row",
  );
  const {
    currentNotebook,
    createNotebook,
    createNote,
    defaultNotebook,
  } = useNotes();
  
  const renderSearch = () => {
    return (
      <div className="flex flex-row p-3">
        <Search />
      </div>
    )
  }

  const renderHomeButton = () => {
    return (
      <Link to={urls.home}>
        <ListItemButton>
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItemButton>
      </Link>
    )
  }

  const renderAccountButton = () => {
    return (
      <div className="flex flex-col justify-end">
        <div className="p-3 border-b border-slate-700">
          Signed in as:
          <div className="pb-3">
            {user?.email}
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
          {renderHomeButton()}
          <div className="flex grow">
            <NotebookList />
          </div>
          <TaskList />
        </List>
      </div>
    )
  }

  const renderActions = () => {
    if (!defaultNotebook) return null;

    return (
      <div className="m-3 flex flex-row">
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => createNote(defaultNotebook.id)}
          fullWidth
        >
          Note
        </Button>
      </div>
    )
  }

  return (
    <div className={containerClasses}>
      <div className="flex flex-col h-[100vh] w-[250px]">
        {renderSearch()}

        {renderActions()}

        {renderContentLists()}
        
        {renderAccountButton()}
        
      </div>

      {currentNotebook && (
        <div className="border-l-2 border-slate-700 w-[225px]">
          <NoteList />
        </div>
      )}
    </div>
  )
}
