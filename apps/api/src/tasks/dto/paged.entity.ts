import { IsNotEmpty, IsNumber, IsArray } from "class-validator";
import { TaskEntity } from "./task.entity";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class PagedTaskList {
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  page: number;

  @IsNumber()
  @IsNotEmpty()
  @Expose()
  resultsPerPage: number;
  
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  totalPages: number;
  
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  totalRecords: number;

  @IsArray()
  @Expose()
  data: TaskEntity[];
}
