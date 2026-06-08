import { Exclude, Expose, instanceToPlain } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

@Exclude()
export class DropdownOptionEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  dropdownId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  label: string;

  @IsString()
  @Expose()
  color: string;

  @IsBoolean()
  @Expose()
  isDefault: boolean;

  @IsInt()
  @Expose()
  order: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @IsOptional()
  @Exclude()
  deletedAt?: Date;

  constructor(partial: Partial<DropdownOptionEntity>) {
    Object.assign(this, instanceToPlain(partial));
  }
}
