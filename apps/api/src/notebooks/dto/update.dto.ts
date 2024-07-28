import { PickType } from '@nestjs/mapped-types';
import { NotebookEntity } from './notebook.entity';

export class UpdateDto extends PickType(
  NotebookEntity,
  [
    'title',
  ] as const,
) {}
