import { Exclude, Expose, instanceToPlain, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DropdownOptionEntity } from './dropdown-option.entity';

@Exclude()
export class DropdownEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @IsOptional()
  @Exclude()
  deletedAt?: Date;

  @IsArray()
  @IsOptional()
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => DropdownOptionEntity)
  options?: DropdownOptionEntity[];

  constructor(partial: Partial<DropdownEntity>) {
    Object.assign(this, instanceToPlain(partial));
  }
}
