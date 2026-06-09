import { Exclude, Expose, instanceToPlain } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@Exclude()
export class DropdownInstanceEntity {
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
  noteId: string;

  @IsString()
  @IsOptional()
  @Expose()
  selectedOptionId?: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @IsOptional()
  @Exclude()
  deletedAt?: Date;

  constructor(partial: Partial<DropdownInstanceEntity>) {
    Object.assign(this, instanceToPlain(partial));
  }
}
