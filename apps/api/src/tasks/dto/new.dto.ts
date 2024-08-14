import { PickType } from '@nestjs/mapped-types';
import { TaskEntity } from './task.entity';

export class NewTaskDto extends PickType(
  TaskEntity,
  [
    'title',
    'description',
    'dueDate',
  ] as const,
) {}