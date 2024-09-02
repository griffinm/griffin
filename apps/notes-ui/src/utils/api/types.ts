export interface CreateOrUpdateTaskProps {
  title?: string;
  description?: string;
  dueDate?: Date;
  completedAt?: Date | null;
  noteId?: string;
}
