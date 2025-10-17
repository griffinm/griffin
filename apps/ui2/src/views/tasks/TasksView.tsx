import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useUpdateTaskStatus } from '@/hooks/useTasks';
import { TaskStatus, Task } from '@/types/task';
import { TaskColumn, TaskDragOverlay } from '@/components/tasks';

export function TasksView() {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const updateTaskStatusMutation = useUpdateTaskStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current as Task;
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('Drag end - active:', active.id, 'over:', over?.id);
    
    if (!over) return;

    const taskId = active.id as string;
    let newStatus: TaskStatus | null = null;

    // Check if we're dropping directly on a column (status)
    if (over.id === TaskStatus.TODO || over.id === TaskStatus.IN_PROGRESS || over.id === TaskStatus.COMPLETED) {
      newStatus = over.id as TaskStatus;
    } else {
      const overElement = document.querySelector(`[data-task-id="${over.id}"]`);
      if (overElement) {
        const columnElement = overElement.closest('[data-column-status]');
        if (columnElement) {
          const columnStatus = columnElement.getAttribute('data-column-status');
          if (columnStatus && (columnStatus === TaskStatus.TODO || columnStatus === TaskStatus.IN_PROGRESS || columnStatus === TaskStatus.COMPLETED)) {
            newStatus = columnStatus as TaskStatus;
          }
        }
      }
      
      if (!newStatus) {
        console.log('Could not determine target column. Skipping update.');
        setActiveTask(null);
        return;
      }
    }

    // Update the task status
    if (newStatus) {
      console.log('Updating task', taskId, 'to status:', newStatus);
      updateTaskStatusMutation.mutate({
        taskId,
        status: newStatus,
      });
    }

    setActiveTask(null);
  };

  return (
    <div className="p-5 w-full max-w-full overflow-hidden">
      <style>
        {`
          .task-column-scroll::-webkit-scrollbar {
            display: none;
          }
          .task-column-scroll {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* Internet Explorer 10+ */
          }
        `}
      </style>
      <h1 className="mb-5 text-2xl font-bold text-gray-900">Tasks</h1>
      
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col lg:flex-row gap-2.5 h-[calc(100vh-200px)] w-full max-w-full overflow-hidden overflow-x-hidden">
          <TaskColumn status={TaskStatus.TODO} title="To Do" />
          <TaskColumn status={TaskStatus.IN_PROGRESS} title="In Progress" />
          <TaskColumn status={TaskStatus.COMPLETED} title="Completed" />
        </div>
        
        <TaskDragOverlay activeTask={activeTask} />
      </DndContext>
    </div>
  );
}
