import { IsString, IsNotEmpty } from 'class-validator';

export class AddTagToObjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

