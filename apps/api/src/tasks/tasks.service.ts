import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Task } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { UpdateTaskDto } from './dto/update.dto';
import { NewTaskDto } from './dto/new.dto';
import { FilterDto } from './dto/filter.dto';
import { TaskEntity } from './dto/task.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  
  constructor(private prisma: PrismaService) {}

  async filter(userId: string, filter: FilterDto): Promise<TaskEntity[]> {
    this.logger.debug(`Filtering tasks for user ${userId} with filter: ${JSON.stringify(filter)}`);
    const whereClause = {
      deletedAt: null,
    };

    if (!filter.page) {
      filter.page = 1;
    }

    if (!filter.resultsPerPage) {
      filter.resultsPerPage = 100;
    }

    let searchClauses = [];
    if (filter.search) {
      searchClauses = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const tasks = await this.prisma.task.findMany({
      where: { 
        userId, 
        ...whereClause,
        ...(searchClauses.length > 0 && { OR: searchClauses }),
        ...(filter.priority && { priority: filter.priority }),
        ...(filter.startDate && { dueDate: { gte: filter.startDate } }),
        ...(filter.endDate && { dueDate: { lte: filter.endDate } }),
        ...(filter.status && { status: filter.status }),
      },
      orderBy: this.ordering(filter.sortBy, filter.sortOrder, filter.status),
      take: filter.resultsPerPage,
      skip: (filter.page - 1) * filter.resultsPerPage,
    });
    
    const objs = tasks.map((task) => {
      return new TaskEntity(task);
    });

    return objs;
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
      orderBy: this.ordering(),
    });
    return tasks;
  }

  async getCountForUser(userId: string): Promise<number> {
    const count = await this.prisma.task.count({
      where: { userId, deletedAt: null, completedAt: null },
    });
    return count;
  }

  async update(id: string, userId: string, task: UpdateTaskDto): Promise<Task> {
    const updatedTask = await this.prisma.task.update({
      where: { id, userId },
      data: task as any,
    });
    return updatedTask;
  }

  async create(userId: string, task: NewTaskDto): Promise<Task> {
    const createdTask = await this.prisma.task.create({
      data: { ...task, userId },
    });
    return createdTask;
  }

  private ordering(sortBy?: string, sortOrder?: string, status?: string): Prisma.TaskOrderByWithAggregationInput[] {
    // If specific sort criteria provided, use it as primary sort
    if (sortBy) {
      const order = sortOrder || 'asc';
      const primarySort = { [sortBy]: { sort: order, nulls: 'last' } };
      
      // Always include priority and createdAt as secondary sorts
      return [
        primarySort,
        { priority: 'desc' },
        { createdAt: 'asc' },
      ];
    }
    
    // Default sorting based on status if no sort criteria provided
    // For completed tasks, sort by completedAt descending (newest first)
    if (status === 'COMPLETED') {
      return [
        { completedAt: { sort: 'desc', nulls: 'last' } },
        { priority: 'desc' },
        { createdAt: 'asc' },
      ];
    }
    
    // For non-completed tasks (TODO, IN_PROGRESS, or all tasks)
    // Sort by dueDate ascending (earliest first, nulls last)
    return [
      { dueDate: { sort: 'asc', nulls: 'last' } },
      { priority: 'desc' },
      { createdAt: 'asc' },
    ];
  }

}
