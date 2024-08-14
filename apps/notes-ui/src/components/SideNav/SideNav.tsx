import { NotebookList } from '../NotebookList'
import { TaskList } from '../TaskList'
import { useNotes } from '../../providers/NoteProvider'
import { NoteList } from '../NoteList'

export function SideNav() {
  const { currentNotebook } = useNotes();
  return (
    <div className="flex flex-row">
      <div className="flex flex-col w-[250px] h-[100vh]">
        <NotebookList />
        <TaskList />
      </div>
      {currentNotebook && (
        <div className="border-l-2 border-slate-700 w-[250px]">
          <NoteList />
        </div>
      )}
    </div>
  )
}
