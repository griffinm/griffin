import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDropdownDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;
}
