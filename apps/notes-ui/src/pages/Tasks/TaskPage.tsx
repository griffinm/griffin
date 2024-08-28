import { Checkbox, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { PageContainer } from "../../components/PageContainer/PageContainer";
import { useTasks } from "../../providers/TaskProvider";
import { useEffect } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Task } from "@prisma/client";

export function TaskPage() {
  const { tasks, fetchTasks } = useTasks();

  useEffect(() => {
    fetchTasks();
  }, []);

  const renderTask = (task: Task) => {
    return (
      <TableRow key={task.id}>
        <TableCell>
          <Checkbox checked={!task.completedAt} />
        </TableCell>
        <TableCell>{task.title}</TableCell>
        <TableCell>
          {task.dueDate && (
            <>
              <div>
                {format(new Date(task.dueDate), "M/d/yy")}
              </div>
              <div>
                <Typography variant="caption">
                  {formatDistanceToNowStrict(new Date(task.dueDate), { addSuffix: true })}
                </Typography>
              </div>
            </>
          )}
          
          </TableCell>
      </TableRow>
    );
  }

  return (
    <PageContainer>
      <Typography variant="h4">Tasks</Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Due</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map(task => renderTask(task))}
        </TableBody>
      </Table>
    </PageContainer>
  )
}
