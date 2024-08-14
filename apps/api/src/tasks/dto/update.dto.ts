import { PickType } from '@nestjs/mapped-types';
import { TaskEntity } from './task.entity';

export class UpdateTaskDto extends PickType(
  TaskEntity,
  [
    'title',
    'description',
    'dueDate',
    'completedAt',
    'deletedAt',
  ] as const,
) {}