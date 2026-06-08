import { IsString, IsNotEmpty } from 'class-validator';

export class AddDefaultTagDto {
  @IsString()
  @IsNotEmpty()
  tagId: string;
}
