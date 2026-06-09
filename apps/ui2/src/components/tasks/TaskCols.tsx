import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useMediaQuery } from '@mantine/hooks';
import { TaskStatus, Task } from '@/types/task';
import { TaskColumn, TaskDragOverlay } from '@/components/tasks';
import { MobileBoard, BoardColumn } from './MobileBoard';
import { useUpdateTaskStatus } from '@/hooks/useTasks';

const COLUMNS: BoardColumn[] = [
  { status: TaskStatus.TODO, title: 'To Do' },
  { status: TaskStatus.IN_PROGRESS, title: 'In Progress' },
  { status: TaskStatus.COMPLETED, title: 'Completed' },
];

export const TaskCols = ({
  setActiveTask,
  activeTask,
  searchTasks,
  selectedPriorities,
  selectedTags,
}: {
  setActiveTask: (_task: Task | null) => void;
  activeTask: Task | null;
  searchTasks?: Task[];
  selectedPriorities?: string[];
  selectedTags?: string[];
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const updateTaskStatusMutation = useUpdateTaskStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current as Task;
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    let newStatus: TaskStatus | null = null;

    if (
      over.id === TaskStatus.TODO ||
      over.id === TaskStatus.IN_PROGRESS ||
      over.id === TaskStatus.COMPLETED
    ) {
      newStatus = over.id as TaskStatus;
    } else {
      const overElement = document.querySelector(`[data-task-id="${over.id}"]`);
      const columnElement = overElement?.closest('[data-column-status]');
      const columnStatus = columnElement?.getAttribute('data-column-status');
      if (
        columnStatus === TaskStatus.TODO ||
        columnStatus === TaskStatus.IN_PROGRESS ||
        columnStatus === TaskStatus.COMPLETED
      ) {
        newStatus = columnStatus as TaskStatus;
      }
      if (!newStatus) {
        setActiveTask(null);
        return;
      }
    }

    if (newStatus) {
      updateTaskStatusMutation.mutate({ taskId, status: newStatus });
    }
    setActiveTask(null);
  };

  if (isMobile) {
    return (
      <MobileBoard
        columns={COLUMNS}
        searchTasks={searchTasks}
        selectedPriorities={selectedPriorities}
        selectedTags={selectedTags}
      />
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="mt-4 flex h-[calc(100vh-210px)] w-full max-w-full gap-5 overflow-hidden lg:gap-7">
        {COLUMNS.map((column) => (
          <TaskColumn
            key={column.status}
            status={column.status}
            title={column.title}
            searchTasks={searchTasks}
            selectedPriorities={selectedPriorities}
            selectedTags={selectedTags}
          />
        ))}
      </div>

      <TaskDragOverlay activeTask={activeTask} />
    </DndContext>
  );
};
