import { IsNotEmpty, IsString } from 'class-validator';

export class NewDropdownInstanceDto {
  @IsString()
  @IsNotEmpty()
  dropdownId: string;

  @IsString()
  @IsNotEmpty()
  noteId: string;
}
