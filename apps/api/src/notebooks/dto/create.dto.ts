import { PickType } from '@nestjs/mapped-types';
import { NotebookEntity } from './notebook.entity';

export class CreateDto extends PickType(
  NotebookEntity,
  [
    'title',
    'parentId',
    'isDefault',
  ] as const,
) {}
