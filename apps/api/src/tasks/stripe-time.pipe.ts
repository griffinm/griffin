import { Injectable, PipeTransform } from "@nestjs/common";
import { UpdateTaskDto } from "./dto/update.dto";
import { NewTaskDto } from "./dto/new.dto";
import { TaskEntity } from "./dto/task.entity";

@Injectable()
/**
 * This pipe is used to strip the time from the dueDate field of a task.
 * This is necessary because the dueDate field is a DateTime field in the database,
 * and we need to compare the dates without the time component.
 */
export class StripeTimePipe implements PipeTransform {
  transform<T extends TaskEntity>(value: T): T {
    if (!value) {
      return value;
    }
    
    if (value instanceof UpdateTaskDto || value instanceof NewTaskDto) {
      if (value.dueDate) {
        const dateObj = new Date(value.dueDate);
        dateObj.setHours(0, 0, 0, 0);
        value.dueDate = dateObj;
      }
    }

    return value;
  }
}
