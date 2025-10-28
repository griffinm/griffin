import { IsString, IsNotEmpty, IsDateString, IsOptional, IsArray } from "class-validator";
import { Exclude, Expose, Type } from "class-transformer";

@Exclude()
export class TagEntity {
 
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  color: string;

  @IsDateString()
  @IsNotEmpty()
  @Expose()
  createdAt: Date;

  @IsDateString()
  @IsNotEmpty()
  @Expose()
  updatedAt: Date;

  @IsDateString()
  @Expose()
  deletedAt?: Date | null;

  @IsString()
  @IsNotEmpty()
  @Expose()
  userId: string;
}