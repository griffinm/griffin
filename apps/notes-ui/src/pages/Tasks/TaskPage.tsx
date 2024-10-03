import { 
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  Input,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { PageContainer } from "../../components/PageContainer/PageContainer";
import { useTasks } from "../../providers/TaskProvider";
import { useEffect, useState, useCallback, useRef } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Task, TaskPriority } from "@prisma/client";
import classnames from "classnames";
import { Delete, Edit } from "@mui/icons-material";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { priorityColors, PrioritySelect } from "../../components/TaskForm/PrioritySelect";
import { CompletedFilterOptions, PriorityOptionType } from "@griffin/types";
import { searchTasks } from "../../utils/api/taskClient";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const INITIAL_PAGE = 1;
const INITIAL_RESULTS_PER_PAGE = 20;
const TIMEOUT = 50;

interface Filters {
  priority?: PriorityOptionType;
  textFilter?: string;
  completed?: CompletedFilterOptions;
  notCompleted?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

export function TaskPage() {
  const [page, setPage] = useState(INITIAL_PAGE);
  const [resultsPerPage, setResultsPerPage] = useState(INITIAL_RESULTS_PER_PAGE);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [confirmDeleteDialogTask, setConfirmDeleteDialogTask] = useState<Task | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    priority: "",
    textFilter: "",
    completed: 'OnlyNotCompleted',
    startDate: dayjs().toDate(),
    endDate: dayjs().add(30, 'day').toDate(),
  });

  const { 
    taskPageTasks, 
    fetchTasksForTaskPage,
    updateTask,
    showNewTaskModal,
    deleteTask,
  } = useTasks();
  const tasks = taskPageTasks.data;

  const debouncedSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchTasks({
        page,
        resultsPerPage,
        search: filters.textFilter,
        priority: filters.priority,
        completed: filters.completed,
        startDate: (filters.startDate || dayjs().subtract(10, 'year').toDate()).toISOString(),
        endDate: (filters.endDate || dayjs().add(10, 'year').toDate()).toISOString(),
      });
    }, TIMEOUT);
  }, [filters, page, resultsPerPage]);

  useEffect(() => {
    debouncedSearch();
  }, [debouncedSearch]);

  useEffect(() => {
    fetchTasksForTaskPage({
      page,
      resultsPerPage,
      search: filters.textFilter,
      priority: filters.priority,
      completed: filters.completed,
      startDate: (filters.startDate || dayjs().subtract(10, 'year').toDate()).toISOString(),
      endDate: (filters.endDate || dayjs().add(10, 'year').toDate()).toISOString(),
    });
  }, [page, resultsPerPage, filters]);

  const renderPriority = (priority: TaskPriority) => {
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

  const renderTask = (task: Task) => {
    const titleClasses = classnames({
      "line-through": !!task.completedAt,
    });

    return (
      <TableRow key={task.id}>
        <TableCell>
          <Checkbox
            checked={!!task.completedAt}
            onChange={(e) => {
              if (e.target.checked) {
                updateTask({ completedAt: new Date() }, task.id);
              } else {
                updateTask({ completedAt: null }, task.id);
              }
            }}
          />
        </TableCell>
        <TableCell>
          <div>
            <span className={titleClasses}>
              {task.title}
            </span>
          </div>
          <div className="mt-2">
            {renderPriority(task.priority)}
          </div>
        </TableCell>
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
          <TableCell>
            <Button size="small" onClick={() => showNewTaskModal(task)}>
              <Edit />
            </Button>
            <Button size="small" onClick={() => {
              setConfirmDeleteDialogOpen(true);
              setConfirmDeleteDialogTask(task);
            }}>
              <Delete />
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  const renderPaging = () => {
    return (
      <TablePagination
        count={taskPageTasks.totalRecords}
        page={page - 1}
        rowsPerPage={resultsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
        onPageChange={(_, page: number) => setPage(page + 1)}
        onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => setResultsPerPage(parseInt(e.target.value))}
      />
    )
  }

  const renderFilters = () => {
    if (!showFilters) {
      return (
        <div className="flex justify-end">
          <Button onClick={() => setShowFilters(true)}>Show Filters</Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-7">
        <div>
          <Input
            fullWidth
            placeholder="Search by title"
       
            value={filters.textFilter} 
            onChange={(e) => setFilters({ ...filters, textFilter: e.target.value })}
          />
        </div>

        <div>
          <PrioritySelect 
            includeNoneOption 
            small
            priority={filters.priority as PriorityOptionType} 
            onChange={(priority) => {
              setFilters({ ...filters, priority: priority as PriorityOptionType });
            }} 
          />
        </div>

        <div>
          <FormControl size="small" fullWidth>
            <InputLabel id="completed-label">Completed</InputLabel>
            <Select
              fullWidth
              size="small"
              labelId="completed-label"
              label="Completed"
              value={filters.completed}
              onChange={(e) => setFilters({ ...filters, completed: e.target.value as CompletedFilterOptions })}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="OnlyCompleted">Only Completed</MenuItem>
              <MenuItem value="OnlyNotCompleted">Only Not Completed</MenuItem>
            </Select>
          </FormControl>
        </div>

        <div className="flex justify-end align-middle">
          <Button
            size="small" 
            onClick={() => setShowFilters(false)}
            color="primary"
          >
            Hide Filters
          </Button>
        </div>

      </div>
    );
  }

  const renderConfirmDeleteDialog = () => {
    if (!confirmDeleteDialogTask) {
      return null;
    }

    return (
      <ConfirmDialog
        open={confirmDeleteDialogOpen}
        data={confirmDeleteDialogTask}
        onClose={() => {
          setConfirmDeleteDialogOpen(false);
          setConfirmDeleteDialogTask(null);
        }}
        onConfirm={deleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
      />
    )
  }

  return (
    <PageContainer>
      {renderConfirmDeleteDialog()}
      <Typography variant="h4">Tasks</Typography>
      {renderFilters()}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Completed</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Due</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map(task => renderTask(task))}
        </TableBody>

        <TableFooter>
          <TableRow>
            {renderPaging()}
          </TableRow>
        </TableFooter>

      </Table>
    </PageContainer>
  )
}
