import { PickType } from '@nestjs/mapped-types';
import { TaskEntity } from './task.entity';

export class FilterDto extends PickType(
  TaskEntity,
  [
    'completedAt',
  ] as const,
) {}