import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NewDropdownOptionDto } from './new-dropdown-option.dto';

export class NewDropdownDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NewDropdownOptionDto)
  options?: NewDropdownOptionDto[];
}
