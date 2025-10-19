import {
  Controller,
  UseGuards,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { TasksService } from './tasks.service';
import { Task } from '@prisma/client';
import { NewTaskDto } from './dto/new.dto';
import { UpdateTaskDto } from './dto/update.dto';
import { RequestWithUser } from "@griffin/types";
import { FilterDto } from './dto/filter.dto';
import { TaskEntity } from './dto/task.entity';
import { PagedTaskList } from './dto/paged.entity';
import { StripeTimePipe } from './stripe-time.pipe';

@Controller()
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TasksController {
  constructor(
    private tasksService: TasksService
  ) {}

  @Get('tasks/:id')
  async getById(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<TaskEntity> {
    const task = await this.tasksService.getById(id, request.user.id);
    return new TaskEntity(task);
  }

  @Get('/tasks')
  async getAllForUser(
    @Req() request: RequestWithUser,
    @Query() query?: FilterDto,
  ): Promise<PagedTaskList> {
    // Always use filter method to ensure proper filtering by status and other criteria
    const tasks: TaskEntity[] = await this.tasksService.filter(request.user.id, query || {});
    
    const totalRecords = await this.tasksService.filter(request.user.id, {
      ...query,
      page: 1,
      resultsPerPage: 10000,
    });

    const pagedTasks = new PagedTaskList();
    pagedTasks.data = tasks;
    pagedTasks.page = query?.page || 1;
    pagedTasks.resultsPerPage = query?.resultsPerPage || 10;
    pagedTasks.totalPages = Math.ceil(totalRecords.length / pagedTasks.resultsPerPage);
    pagedTasks.totalRecords = totalRecords.length;
    return pagedTasks;
  }
  
  @Delete('tasks/:id')
  async deleteById(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<Task> {
    return this.tasksService.deleteById(id, request.user.id);
  }

  @Post('tasks')
  async create(
    @Req() request: RequestWithUser,
    @Body(StripeTimePipe) task: NewTaskDto,
  ): Promise<Task> {
    return this.tasksService.create(request.user.id, task);
  }

  @Patch('tasks/:id')
  async update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body(StripeTimePipe) task: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(id, request.user.id, task);
  }
}
