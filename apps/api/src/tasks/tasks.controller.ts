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
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { TasksService } from './tasks.service';
import { TaskEntity } from './dto/task.entity';
import { Task } from '@prisma/client';
import { NewTaskDto } from './dto/new.dto';
import { UpdateTaskDto } from './dto/update.dto';

@Controller()
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TasksController {
  constructor(
    private tasksService: TasksService
  ) {}

  @Get('tasks/:id')
  async getById(
    @Req() request: any,
    @Param('id') id: string,
  ): Promise<Task> {
    return this.tasksService.getById(id, request.user.id);
  }

  @Get('/tasks')
  async getAllForUser(
    @Req() request: any,
  ): Promise<Task[]> {
    return this.tasksService.getAllForUser(request.user.id);
  }
  
  @Delete('tasks/:id')
  async deleteById(
    @Req() request: any,
    @Param('id') id: string,
  ): Promise<Task> {
    return this.tasksService.deleteById(id, request.user.id);
  }

  @Post('tasks')
  async create(
    @Req() request: any,
    @Body() task: NewTaskDto,
  ): Promise<Task> {
    return this.tasksService.create(request.user.id, task);
  }

  @Patch('tasks/:id')
  async update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() task: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(id, request.user.id, task);
  }
}