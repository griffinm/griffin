import { IsString, IsNotEmpty, IsDateString, IsArray, IsOptional } from "class-validator";
import { Exclude, Expose, Type } from "class-transformer";
import { NoteEntity } from "../../notes/dto/note.entity";
import { TaskEntity } from "../../tasks/dto/task.entity";

@Exclude()
export class TagWithObjectsEntity {
 
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

  @IsArray()
  @IsOptional()
  @Expose()
  @Type(() => NoteEntity)
  notes?: NoteEntity[];

  @IsArray()
  @IsOptional()
  @Expose()
  @Type(() => TaskEntity)
  tasks?: TaskEntity[];
}

