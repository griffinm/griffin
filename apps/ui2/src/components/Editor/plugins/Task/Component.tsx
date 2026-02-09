import { useEffect, useRef, useState } from 'react'
import { Button, Checkbox, TextInput, Textarea, Select } from '@mantine/core'
import { NodeViewWrapper } from '@tiptap/react'
import { DatePickerInput } from '@mantine/dates';
import { format, formatDistanceToNow } from 'date-fns';
import { createTask, updateTask, fetchTaskById } from '@/api/tasksApi';
import { TaskPriority } from '@/types/task';
import { IconCheck, IconX } from '@tabler/icons-react';
import '@mantine/dates/styles.css';
import type { NodeViewProps } from '@tiptap/react';

const priorityOptions = [
  { value: TaskPriority.LOW, label: 'Low' },
  { value: TaskPriority.MEDIUM, label: 'Medium' },
  { value: TaskPriority.HIGH, label: 'High' },
];

export function Component(props: NodeViewProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [completed, setCompleted] = useState(false);
  const [description, setDescription] = useState('');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (props.node.attrs.taskId && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchTaskById(props.node.attrs.taskId).then((task) => {
        setTitle(task.title);
        setDueDate(task.dueDate ? new Date(task.dueDate) : new Date());
        setDescription(task.description || '');
        setCompleted(task.completedAt !== null);
        setPriority(task.priority);
      })
    }
  }, [props.node.attrs.taskId])

  const handleToggleCompleted = () => {
    const newCompleted = !completed;
    setCompleted(newCompleted);
    if (props.node.attrs.taskId) {
      updateTask(props.node.attrs.taskId, {
        title,
        dueDate,
        description,
        priority,
        status: newCompleted ? 'COMPLETED' : 'TODO',
      })
    }
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!props.node.attrs.taskId) {
      // This is a new task
      createTask({
        title,
        dueDate,
        description,
        priority,
        status: 'TODO',
      }).then((task) => {
        props.updateAttributes({
          taskId: task.id,
        })
      })
    } else {
      // This is an existing task
      updateTask(props.node.attrs.taskId, {
        title,
        dueDate,
        description,
        priority,
      })
    }

    setIsSelected(false);
  }

  const renderEdit = () => {
    return (
      <form
        onSubmit={handleSave}
        className="flex flex-col gap-3 p-3 bg-[var(--mantine-color-default-hover)] rounded"
      >
        <div className="flex flex-row gap-2">
          <div className="flex-1">
            <TextInput
              placeholder="Task title"
              size="sm"
              onChange={(e) => setTitle(e.target.value)}
              value={title}
              autoFocus
              required
            />
          </div>
          <div className="w-32">
            <Select
              size="sm"
              data={priorityOptions}
              value={priority}
              onChange={(value) => setPriority(value as TaskPriority)}
            />
          </div>
        </div>
        
        <Textarea
          placeholder="Task description (optional)"
          size="sm"
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          minRows={2}
          maxRows={4}
        />
        
        <div className="flex flex-row gap-2 items-center justify-between">
          <DatePickerInput
            size="sm"
            label="Due Date"
            value={dueDate}
            onChange={(value) => {
              if (value) {
                setDueDate(new Date(value));
              } else {
                setDueDate(new Date());
              }
            }}
            className="flex-1"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              size="xs"
              variant="subtle"
              onClick={() => setIsSelected(false)}
              leftSection={<IconX size={14} />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="xs"
              leftSection={<IconCheck size={14} />}
            >
              Save
            </Button>
          </div>
        </div>
      </form>
    )
  }

  const renderShow = () => {
    return (
      <div className="flex items-center gap-2 py-1 px-2 hover:bg-[var(--mantine-color-default-hover)] rounded cursor-pointer transition-colors">
        <Checkbox
          checked={completed}
          onChange={handleToggleCompleted}
        />
        <div 
          className={`flex-1 ${completed ? 'line-through text-[var(--mantine-color-dimmed)]' : ''}`}
          onClick={() => setIsSelected(true)}
        >
          {title || 'Untitled Task'}
        </div>
        <div className="text-xs text-[var(--mantine-color-dimmed)] text-right">
          <div>{format(dueDate, 'M/dd')}</div>
          <div className="text-[10px]">
            {formatDistanceToNow(dueDate, { addSuffix: true })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <NodeViewWrapper className="task-component">
      <div 
        contentEditable={false}
        data-drag-handle
      >
        {isSelected ? renderEdit() : renderShow()}
    </div>
    </NodeViewWrapper>
  )
}

