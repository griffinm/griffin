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

      <div className="p-2 flex items-center justify-between">
        <Typography variant='body1'>Notebooks</Typography>
        <Button
          size='small'
          variant='outlined'
        >
          New
        </Button>
      </div>

      <div>
        <NotebookList />
      </div>
    </div>
  )
}
