import { IsNotEmpty, IsString } from 'class-validator';

export class CloneDataTableDto {
  @IsString()
  @IsNotEmpty()
  noteId: string;

  @IsString()
  @IsNotEmpty()
  sourceId: string;
}
