import { 
  Button,
  Checkbox,
  FormControl,
  Input,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { PageContainer } from "../../components/PageContainer/PageContainer";
import { useTasks } from "../../providers/TaskProvider";
import { useEffect, useState, useCallback, useRef } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Task } from "@prisma/client";
import classnames from "classnames";
import { ArrowBackIos, ArrowForwardIos, Delete, Edit } from "@mui/icons-material";

const INITIAL_PAGE = 1;
const INITIAL_RESULTS_PER_PAGE = 20;
const TIMEOUT = 250;

export function TaskPage() {
  const [page, setPage] = useState(INITIAL_PAGE);
  const [resultsPerPage, setResultsPerPage] = useState(INITIAL_RESULTS_PER_PAGE);
  const [search, setSearch] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    taskPageTasks, 
    fetchTasksForTaskPage,
    updateTask,
    showNewTaskModal,
  } = useTasks();
  const tasks = taskPageTasks.data;

  const debouncedSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchTasksForTaskPage({
        page,
        resultsPerPage,
        search,
      });
    }, TIMEOUT);
  }, [search]);

  useEffect(() => {
    debouncedSearch();
  }, [debouncedSearch]);

  useEffect(() => {
    fetchTasksForTaskPage({
      page,
      resultsPerPage,
      search,
    });
  }, [page, resultsPerPage]);

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
          <span className={titleClasses}>
            {task.title}
          </span>
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
            <Button size="small">
              <Delete />
            </Button>
          </TableCell>
      </TableRow>
    );
  }

  const renderTop = () => {
    return (
      <div>
        <div>
          <div className="flex py-4 justify-between">
            <div>
              <Input
                placeholder="Search by title"
                size="small"
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-center">
                <div>
                  <Button
                    startIcon={<ArrowBackIos />}
                    size="small"
                    onClick={() => setPage(page - 1)}
                    variant="text"
                    sx={{ color: '#FFF'}}
                    disabled={page <= 1}
                  />
                </div>
                <div>
                  Page {page} of {taskPageTasks.totalPages}
                </div>
                <div>
                  <Button
                    startIcon={<ArrowForwardIos />}
                    size="small"
                    onClick={() => setPage(page + 1)}
                    variant="text"
                    sx={{ color: '#FFF'}}
                    disabled={page >= taskPageTasks.totalPages}
                  />
                </div>
              </div>
            </div>

            <div>
              <FormControl size="small">
                <InputLabel id="results-per-page-label">Results per page</InputLabel>
                <Select
                  labelId="results-per-page-label"
                  label="Results per page"
                  value={resultsPerPage}
                  sx={{ minWidth: '120px' }}
                  onChange={(e) => setResultsPerPage(e.target.value as number)}
                >
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
            </div>

          </div>
        </div>

        
      </div>
    )
  }

  return (
    <PageContainer>
      <Typography variant="h4">Tasks</Typography>
      {renderTop()}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Due</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map(task => renderTask(task))}
        </TableBody>
      </Table>
    </PageContainer>
  )
}
