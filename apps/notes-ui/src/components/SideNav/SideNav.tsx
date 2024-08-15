import { NotebookList } from '../NotebookList'
import { TaskList } from '../TaskList'
import { useNotes } from '../../providers/NoteProvider'
import { NoteList } from '../NoteList'
import { Search } from '../Search'
import classnames from 'classnames'

interface Props {
  menuExpanded: boolean;
}

export function SideNav({ menuExpanded }: Props) {
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
          <>
            <NotebookList />
            <TaskList />
          </>
        )}
        {currentNotebook && (
          <div className="border-l-2 border-slate-700 w-[250px]">
            <NoteList />
          </div>
        )}
      </div>
    </div>
  )
}
