import { IsString, IsNotEmpty, IsDateString } from "class-validator";
import { Exclude, Expose } from "class-transformer";

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

  @IsString()
  @IsNotEmpty()
  @Expose()
  objectType: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  objectId: string;
}