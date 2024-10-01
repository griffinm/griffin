import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { TaskPriority } from "@prisma/client";
import { red, orange, green } from "@mui/material/colors";

type PriorityWithNone = TaskPriority | "";

interface Props<T> {
  priority: T;
  onChange: (priority: T) => void;
  includeNoneOption?: boolean;
  small?: boolean;
}

export const priorityColors: Record<PriorityWithNone | TaskPriority, string> = {
  [TaskPriority.LOW]: green[500],
  [TaskPriority.MEDIUM]: orange[500],
  [TaskPriority.HIGH]: red[500],
  [""]: 'auto',
}

export function PrioritySelect({ 
  priority, 
  onChange, 
  includeNoneOption = false,
  small = false,
}: Props<PriorityWithNone | TaskPriority>) {


  let priorityOptions = [
    { value: TaskPriority.LOW, label: 'Low' },
    { value: TaskPriority.MEDIUM, label: 'Medium' },
    { value: TaskPriority.HIGH, label: 'High' },
  ];

  return (
    <FormControl fullWidth>
      <InputLabel id="priority-label">Priority</InputLabel>
      <Select
        size={small ? 'small' : 'medium'}
        fullWidth
        labelId="priority-label"
        id="priority-select"
        label="Priority"
        value={priority}
        onChange={(e) => onChange(e.target.value as PriorityWithNone)}
        sx={{
          color: priorityColors[priority],
          '& .MuiSelect-icon': {
            color: priorityColors[priority],
          },
        }}
      >
        {includeNoneOption && (
          <MenuItem value="" sx={{ color: priorityColors[""], fontWeight: 'bold' }}>
            None
          </MenuItem>
        )}
        {priorityOptions.map((option) => (
          <MenuItem key={option.value} value={option.value} sx={{ color: priorityColors[option.value], fontWeight: 'bold' }}>
            {option.label}
          </MenuItem>
        ))}

      </Select>
    </FormControl>
  )
}
