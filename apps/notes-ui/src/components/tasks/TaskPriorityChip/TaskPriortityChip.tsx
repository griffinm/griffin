import { Chip } from "@mui/material";
import { priorityColors } from "../../TaskForm/PrioritySelect";

export function TaskPriorityChip({ priority }: { priority: string }) {
  return (
    <Chip 
      size="small" 
      label={priority} 
      color="primary"
      sx={{
        backgroundColor: priorityColors[priority],
        color: '#FFF',
      }}
    />
  )
}
