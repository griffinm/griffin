import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Task } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { UpdateTaskDto } from './dto/update.dto';
import { NewTaskDto } from './dto/new.dto';
import { FilterDto } from './dto/filter.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  
  constructor(private prisma: PrismaService) {}

  async filter(userId: string, filter: FilterDto): Promise<Task[]> {
    this.logger.debug(`Filtering tasks for user ${userId} with filter: ${JSON.stringify(filter)}`);
    let whereClause = {
      deletedAt: null,
      completedAt: null,
    };

    if (filter.completedAt === 'null') {
      whereClause.completedAt = null;
    }

    if (!filter.page) {
      filter.page = 1;
    }

    if (!filter.resultsPerPage) {
      filter.resultsPerPage = 100;
    }
    
    const tasks = await this.prisma.task.findMany({
      where: { 
        userId, 
        ...whereClause,
      },
      orderBy: { dueDate: 'asc' },
      take: filter.resultsPerPage,
      skip: (filter.page - 1) * filter.resultsPerPage,
    });
    return tasks;
  }

  async getById(id: string, userId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id, userId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async deleteById(id: string, userId: string): Promise<Task> {
    const task = await this.prisma.task.update({
      where: { id, userId },
      data: { deletedAt: new Date() },
    });
    return task;
  }

  async getAllForUser(userId: string): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { userId, deletedAt: null },
    });
    return tasks;
  }

  async update(id: string, userId: string, task: UpdateTaskDto): Promise<Task> {
    const updatedTask = await this.prisma.task.update({
      where: { id, userId },
      data: task,
    });
    return updatedTask;
  }

  async create(userId: string, task: NewTaskDto): Promise<Task> {
    const createdTask = await this.prisma.task.create({
      data: { ...task, userId },
    });
    return createdTask;
  }
}
