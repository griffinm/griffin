import { NotebookList } from '../NotebookList'
import { TaskList } from '../TaskList'
import { useNotes } from '../../providers/NoteProvider'
import { NoteList } from '../NoteList'
import { Search } from '../Search'
import classnames from 'classnames'
import { useUser } from '../../providers/UserProvider'
import { Button } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout';
interface Props {
  menuExpanded: boolean;
}

export function SideNav({ menuExpanded }: Props) {
  const { user, signOut } = useUser();
  const menuClasses = classnames(
    "flex flex-row md:w-[250px] h-[100vh] md:block",
    {
      "hidden": !menuExpanded,
      "w-[250px]": menuExpanded,
    },
  );

  const { currentNotebook } = useNotes();
  return (
    <div className={menuClasses}>
      <div className="flex flex-col h-[100vh]">
        <div className="flex flex-row p-3">
          <Search />
        </div>
        {!currentNotebook && (
          <div className="grow">
            <NotebookList />
            <TaskList />
          </div>
          )}
        {currentNotebook && (
          <div className="border-l-2 border-slate-700 w-[250px] grow">
            <NoteList />
          </div>
        )}
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
      </div>
    </div>
  )
}
