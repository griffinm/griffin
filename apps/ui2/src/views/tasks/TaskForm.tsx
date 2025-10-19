import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { useState } from "react";
import { TextInput, Button, Stack } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { PrioritySelect } from "./PrioritySelect";
import { StatusSelect } from "./StatusSelect";
import { IconCheck, IconX } from "@tabler/icons-react";
import '@mantine/dates/styles.css';
import { getDatePresets } from "./utils";
import { Editor } from "@/components/Editor";

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        title,
        description,
        dueDate,
        priority,
        status,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          value={title} 
          placeholder="Task Title"
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
          size="md"
          label="Title"
        />
        
        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <Editor
            value={description}
            onChange={setDescription}
            minHeight="150px"
            maxHeight="300px"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DatePickerInput
            label="Due Date"
            value={dueDate}
            onChange={(value) => setDueDate(value ? new Date(value) : new Date())}
            allowDeselect={false}
            presets={getDatePresets()}
            size="sm"
          />
          <PrioritySelect priority={priority} onChange={setPriority} size="sm" />
          <StatusSelect status={status} onChange={setStatus} size="sm" />
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            onClick={onCancel} 
            leftSection={<IconX size={16} />}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            size="sm" 
            leftSection={<IconCheck size={16} />}
          >
            Save
          </Button>
        </div>
      </Stack>
    </form>
  );
}
