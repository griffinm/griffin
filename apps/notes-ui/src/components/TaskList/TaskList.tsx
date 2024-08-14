import { useState } from "react";
import { 
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { TaskItem } from "./TaskItem";
import { useTasks } from "../../providers/TaskProvider";
import { ExpandMore, ExpandLess, Add, CheckCircle } from '@mui/icons-material';
import { Task } from "@prisma/client";

export function TaskList() {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const [expanded, setExpanded] = useState(false);

  const onToggleComplete = (task: Task) => {
    updateTask({ 
      completedAt: task.completedAt ? null : new Date(),
      dueDate: task.dueDate || new Date(),
      title: task.title,
      description: task.description || "",
    }, task.id)
  }

  return (
    <div>
      <List
        sx={{ width: '100%' }}
        component="nav"

      >
        <ListItemButton onClick={() => setExpanded(!expanded)}>
          <ListItemIcon>
            <CheckCircle />
          </ListItemIcon>
          <ListItemText primary="Tasks"  />
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        
        <Collapse in={expanded} unmountOnExit timeout="auto">
          <List disablePadding sx={{ pl: 3 }}>
            <ListItemButton sx={{ pl: 3 }} onClick={() => navigate('/tasks/new')}>
              <ListItemIcon>
                <Add />
              </ListItemIcon>
              <ListItemText primary="New Task" />
            </ListItemButton>
            <Divider component="li" />
            {tasks.map((task) => (
              <div key={task.id}>
                <TaskItem key={task.id} task={task} onToggleComplete={onToggleComplete} />
                <Divider component="li" />
              </div>
            ))}
          </List>
        </Collapse>
      </List>
    </div>
  )
}