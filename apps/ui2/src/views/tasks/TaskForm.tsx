import { Task, TaskPriority } from "@/types/task";
import { useState } from "react";
import { TextInput } from "@mantine/core";
import { Button } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { PrioritySelect } from "./PrioritySelect";
import { IconCheck, IconX } from "@tabler/icons-react";
import '@mantine/dates/styles.css';
import { Editor } from "@/components/Editor";
import { getDatePresets } from "./utils";

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate: Date;
  priority: TaskPriority;
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
  const [description, setDescription] = useState(task?.description);
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate) : new Date());
  const [priority, setPriority] = useState(task?.priority || TaskPriority.MEDIUM);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        title,
        description,
        dueDate,
        priority,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <div>
          <TextInput
            value={title} 
            placeholder="Title"
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            variant="unstyled"
            required
            styles={{
              input: { fontSize: '1.5rem', fontWeight: 'bold' }
            }}
            />
        </div>
        
        {/* Start 2 column layout */}
        <div className="flex flex-row gap-2">

          {/* Left Column */}
          <div className="w-3/4">
            <Editor 
              value={description || ''} 
              onChange={setDescription}
              minHeight="200px"
              maxHeight="300px"
              />
          </div>

          {/* Right Column */}
          <div className="pl-4 rounded-lg w-1/4 flex flex-col gap-4">
            <DatePickerInput
              label="Due Date"
              value={dueDate}
              onChange={(value) => setDueDate(value ? new Date(value) : new Date())}
              allowDeselect={false}
              presets={getDatePresets()}
              size="xs"
              />
            <PrioritySelect priority={priority} onChange={setPriority} size="xs" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" size="xs" variant="outline" onClick={onCancel} leftSection={<IconX size={16} />}>Cancel</Button>
          <Button type="submit" size="xs" leftSection={<IconCheck size={16} />}>Save</Button>
        </div>
      </div>
    </form>
  );
}
