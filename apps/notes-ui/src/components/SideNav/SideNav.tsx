import {
  Divider,
} from '@mui/material'
import { NotebookList } from '../NotebookList'
import { TaskList } from '../TaskList'

export function SideNav() {

  return (
    <div className="flex flex-col bg-right w-[250px] border-r border-gray-200 h-[100vh]">

      <div>
        <NotebookList />
      </div>

      <Divider />

      <div>
        <TaskList />
      </div>
    </div>
  )
}
