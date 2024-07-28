import { Add } from '@mui/icons-material'
import {
  Button,
  Divider,
  Typography,
} from '@mui/material'
import { NotebookList } from '../NotebookList'

export function SideNav() {

  return (
    <div className="flex flex-col bg-right w-[250px] border-r border-gray-200 h-[100vh]">
      <div className="p-5">
        <Button
          fullWidth
          variant='contained'
          startIcon={<Add />}
        >
        New
        </Button>
      </div>

      <Divider />

      <div>
        <NotebookList />
      </div>
    </div>
  )
}
