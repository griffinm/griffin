import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { Tag } from "@/types/tag";
import { useState } from "react";
import { Button, Textarea } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { PrioritySelect } from "./PrioritySelect";
import { StatusSelect } from "./StatusSelect";
import { IconCheck, IconX } from "@tabler/icons-react";
import '@mantine/dates/styles.css';
import { getDatePresets } from "./utils";
import { Editor } from "@/components/Editor";
import { StatusHistory } from "@/components/tasks/StatusHistory";
import { TagManager } from "@/components/TagManager";

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
  tags?: Tag[];
}

export function TaskForm({
  task,
  onSubmit,
  onCancel,
}: {
  task?: Task,
  onSubmit?: (_data: TaskFormData) => void,
  onCancel?: () => void,
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate) : new Date());
  const [priority, setPriority] = useState(task?.priority || TaskPriority.MEDIUM);
  const [status, setStatus] = useState(task?.status || TaskStatus.TODO);
  const [tags, setTags] = useState<Tag[]>(task?.tags || []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.({ title, description, dueDate, priority, status, tags });
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-1">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Left column — title + editor. flex-1 + min-w-0 give it a deterministic
              width so typing in the editor never reflows the layout. */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Textarea
              value={title}
              variant="unstyled"
              placeholder="Task title"
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
              rows={1}
              autosize
              maxRows={3}
              styles={{
                input: {
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.6rem',
                  fontWeight: 500,
                  lineHeight: 1.2,
                  padding: 0,
                },
              }}
            />
            <div className="w-full min-w-0">
              <Editor
                value={description}
                onChange={setDescription}
                minHeight="180px"
                maxHeight="340px"
              />
            </div>
          </div>

          {/* Right column — fixed width (replaces the invalid `sm:w-3/8`). */}
          <div className="flex flex-col gap-3.5 sm:w-72 sm:shrink-0 sm:border-l sm:border-[var(--at-line)] sm:pl-6">
            <div className="task-meta text-[10px] text-[var(--mantine-color-dimmed)]">Details</div>
            <DatePickerInput
              label="Due date"
              value={dueDate}
              onChange={(value) => setDueDate(value ? new Date(value) : new Date())}
              allowDeselect={false}
              presets={getDatePresets()}
              size="sm"
            />
            <PrioritySelect priority={priority} onChange={setPriority} size="sm" />
            <StatusSelect status={status} onChange={setStatus} size="sm" />

            <div>
              <label className="mb-1 block text-sm font-medium">Tags</label>
              <TagManager tags={tags} onChange={setTags} placeholder="Add tags..." />
            </div>
          </div>
        </div>

        {/* Status History */}
        {task?.statusHistory && task.statusHistory.length > 1 && (
          <div className="mt-6 border-t border-[var(--at-line)] pt-4">
            <StatusHistory history={task.statusHistory} />
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--at-line)] bg-[var(--mantine-color-body)] px-5 py-3">
        <Button type="button" size="sm" variant="default" onClick={onCancel} leftSection={<IconX size={16} />}>
          Cancel
        </Button>
        <Button type="submit" size="sm" leftSection={<IconCheck size={16} />}>
          Save
        </Button>
      </div>
    </form>
  );
}
