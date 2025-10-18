import { TaskPriority } from "@/types/task";
import { Select } from "@mantine/core";

export function PrioritySelect({
  priority,
  onChange,
  size = 'md',
}: {
  priority: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}) {
  const handleChange = (value: string | null) => {
    if (!value) {
      return;
    }
    onChange(value as TaskPriority);
  };

  return (
    <Select
      size={size}
      label="Priority"
      value={priority}
      onChange={handleChange}
      data={[
        { label: 'Low', value: TaskPriority.LOW },
        { label: 'Medium', value: TaskPriority.MEDIUM },
        { label: 'High', value: TaskPriority.HIGH },
      ]}
    />
  );
}
