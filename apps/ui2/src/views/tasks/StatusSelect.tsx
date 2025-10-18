import { TaskStatus } from "@/types/task";
import { Select } from "@mantine/core";

export function StatusSelect({
  status,
  onChange,
  size = 'md',
}: {
  status: TaskStatus;
  onChange: (_status: TaskStatus) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}) {
  const handleChange = (value: string | null) => {
    if (!value) {
      return;
    }
    onChange(value as TaskStatus);
  };

  return (
    <Select
      size={size}
      label="Status"
      value={status}
      onChange={handleChange}
      data={[
        { label: 'To Do', value: TaskStatus.TODO },
        { label: 'In Progress', value: TaskStatus.IN_PROGRESS },
        { label: 'Done', value: TaskStatus.COMPLETED },
      ]}
    />
  );
}

