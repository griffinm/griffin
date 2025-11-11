import { Task, TaskPriority, TaskStatus } from "@/types/task";
import { Tag } from "@/types/tag";
import { useState, useEffect } from "react";
import { TextInput, Button, Stack, Textarea } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { PrioritySelect } from "./PrioritySelect";
import { StatusSelect } from "./StatusSelect";
import { IconCheck, IconX, IconSparkles } from "@tabler/icons-react";
import '@mantine/dates/styles.css';
import { getDatePresets } from "./utils";
import { Editor } from "@/components/Editor";
import { StatusHistory } from "@/components/tasks/StatusHistory";
import { TagManager } from "@/components/TagManager";
import { enhanceTaskWithAI, EnhanceTaskResponse } from "@/api/tasksApi";
import { TaskEnhancementModal } from "@/components/tasks/TaskEnhancementModal";

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
  enhancedDescription,
}: {
  task?: Task,
  onSubmit?: (_data: TaskFormData) => void,
  onCancel?: () => void,
  enhancedDescription?: string,
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate) : new Date());
  const [priority, setPriority] = useState(task?.priority || TaskPriority.MEDIUM);
  const [status, setStatus] = useState(task?.status || TaskStatus.TODO);
  const [tags, setTags] = useState<Tag[]>(task?.tags || []);
  const [enhancementModalOpened, setEnhancementModalOpened] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementError, setEnhancementError] = useState<string | null>(null);
  const [enhancementData, setEnhancementData] = useState<EnhanceTaskResponse | null>(null);
  const [originalDescription, setOriginalDescription] = useState(task?.description || '');

  // Apply enhanced description when provided
  useEffect(() => {
    if (enhancedDescription) {
      setDescription(enhancedDescription);
    }
  }, [enhancedDescription]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        title,
        description,
        dueDate,
        priority,
        status,
        tags,
      });
    }
  };

  const handleEnhanceWithAI = async () => {
    if (!task?.id) return;

    setOriginalDescription(description);
    setEnhancementModalOpened(true);
    setIsEnhancing(true);
    setEnhancementError(null);
    setEnhancementData(null);

    try {
      const result = await enhanceTaskWithAI(task.id);
      setEnhancementData(result);
    } catch (error) {
      console.error('Error enhancing task:', error);
      setEnhancementError('Failed to enhance task description. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleApplyEnhancement = (enhancedDesc: string) => {
    setDescription(enhancedDesc);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row gap-6 flex-1">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <Textarea
            value={title}
            variant="unstyled"
            placeholder="Task Title"
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            size="2xl"
            rows={1}
            autosize
            maxRows={3}
          />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="text-sm font-medium">Description</label>
              {task?.id && (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconSparkles size={14} />}
                  onClick={handleEnhanceWithAI}
                >
                  Enhance with AI
                </Button>
              )}
            </div>
            <Editor
              value={description}
              onChange={setDescription}
              minHeight="150px"
              maxHeight="300px"
            />
          </div>


        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-2 sm:w-3/8">
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
          
          <div>
            <label className="text-sm font-medium mb-1 block">Tags</label>
            <TagManager tags={tags} onChange={setTags} placeholder="Add tags..." />
          </div>
        </div>
      </div>

      {/* Status History - Full Width */}
      {task?.statusHistory && task.statusHistory.length > 1 && (
        <StatusHistory history={task.statusHistory} />
      )}

      {/* Action Footer */}
      <div className="mt-3 fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto flex justify-end gap-2 p-4 sm:p-0 bg-white z-10">
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

      <TaskEnhancementModal
        opened={enhancementModalOpened}
        onClose={() => setEnhancementModalOpened(false)}
        onApply={handleApplyEnhancement}
        isLoading={isEnhancing}
        error={enhancementError}
        enhancementData={enhancementData}
        originalDescription={originalDescription}
      />
    </form>
  );
}
