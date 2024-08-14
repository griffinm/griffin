import {
  Divider,
} from '@mui/material'
import { NotebookList } from '../NotebookList'
import { TaskList } from '../TaskList'
import { useNotes } from '../../providers/NoteProvider'
import { NoteList } from '../NoteList'

export function SideNav() {
  const { currentNotebook } = useNotes();
  return (
    <div className="flex flex-row">
      <div className="flex flex-col bg-right w-[250px] border-r border-gray-200 h-[100vh]">

        <div>
          <NotebookList />
        </div>

        <div>
          <TaskList />
        </div>
      </div>
      {currentNotebook && (
        <div className="bg-right w-[250px] border-r border-gray-200 h-100vh">
          <NoteList />
        </div>
      )}
    </div>
  )
}
