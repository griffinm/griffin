import { Task, TaskPriority } from "@/types/task";
import { HtmlPreview } from '@/components/HtmlPreview';
import { Priority } from "./Priority";
import { DueDate } from "./DueDate";
import { Group, Pill } from '@mantine/core';
import { getTagColors } from '@/utils/tagColors';

export function TaskRow({ 
  task,
  setActiveTask,
  activeTask,
}: {
  task: Task;
  setActiveTask: (task: Task | null) => void;
  activeTask: Task | null;
}) {
  return (
    <div className="flex flex-col gap-2 border border-gray-200 p-2 hover:bg-gray-50 transition-all duration-100 rounded-md shadow-md" onClick={() => setActiveTask(task)}>
      <div className="flex flex-row items-center">
        <div className="w-1/3">
          <h2 className="text-sm text-gray-700 font-bold">{task.title}</h2>
        </div>
        <div className="flex w-1/3 justify-center">
          <Priority priority={task.priority as TaskPriority} />
        </div>
        <div className="w-1/3">
          <DueDate dueDate={task.dueDate} />
        </div>
      </div>
      
      <HtmlPreview html={task.description || ''} maxHeight={true} />
      
      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <Group gap="xs" className="mt-1">
          {task.tags.map(tag => {
            const colors = getTagColors(tag.color);
            return (
              <Pill 
                key={tag.id} 
                size="xs"
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                }}
              >
                {tag.name}
              </Pill>
            );
          })}
        </Group>
      )}
    </div>
  )
}