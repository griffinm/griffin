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
  ): Promise<Task> {
    return this.tasksService.getById(id, request.user.id);
  }

  @Get('/tasks')
  async getAllForUser(
    @Req() request: RequestWithUser,
    @Query() query?: FilterDto,
  ): Promise<Task[]> {
    console.log('filter', query);
    if (query) {
      return this.tasksService.filter(request.user.id, query);
    }
    return this.tasksService.getAllForUser(request.user.id);
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
    @Body() task: NewTaskDto,
  ): Promise<Task> {
    return this.tasksService.create(request.user.id, task);
  }

  @Patch('tasks/:id')
  async update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() task: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(id, request.user.id, task);
  }
}
