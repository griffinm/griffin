import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['note', 'task'])
  objectType: 'note' | 'task';

  @IsString()
  @IsNotEmpty()
  objectId: string;
}

