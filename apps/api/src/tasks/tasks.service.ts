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
    this.logger.debug(`Filtering tasks for user ${userId}; filter: ${JSON.stringify(filter)}`);
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

    // Handle multiple statuses (comma-separated)
    let statusFilter = {};
    if (filter.status) {
      const statuses = filter.status.includes(',') 
        ? filter.status.split(',').map(s => s.trim())
        : [filter.status];
      statusFilter = statuses.length > 1 ? { status: { in: statuses } } : { status: filter.status };
    }

    const tasks = await this.prisma.task.findMany({
      where: { 
        userId, 
        ...whereClause,
        ...(searchClauses.length > 0 && { OR: searchClauses }),
        ...(filter.priority && { priority: filter.priority }),
        ...(filter.startDate && { dueDate: { gte: filter.startDate } }),
        ...(filter.endDate && { dueDate: { lte: filter.endDate } }),
        ...statusFilter,
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
      include: {
        statusHistory: {
          orderBy: {
            changedAt: 'desc',
          },
        },
      },
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
    // Get the existing task to check if status has changed
    const existingTask = await this.getById(id, userId);
    
    // Update the task
    const updatedTask = await this.prisma.task.update({
      where: { id, userId },
      data: task,
    });
    
    // If status has changed, create a status history entry
    if (task.status && task.status !== existingTask.status) {
      await this.prisma.taskStatusHistory.create({
        data: {
          taskId: id,
          status: task.status,
        },
      });
    }
    
    return updatedTask;
  }

  async create(userId: string, task: NewTaskDto): Promise<Task> {
    const createdTask = await this.prisma.task.create({
      data: { ...task, userId },
    });
    
    // Create initial status history entry
    await this.prisma.taskStatusHistory.create({
      data: {
        taskId: createdTask.id,
        status: createdTask.status,
      },
    });
    
    return createdTask;
  }

  private ordering(sortBy?: string, sortOrder?: string, status?: string): Prisma.TaskOrderByWithRelationInput[] {
    // If specific sort criteria provided, use it as primary sort
    if (sortBy) {
      const order = (sortOrder || 'asc') as 'asc' | 'desc';
      const primarySort = { [sortBy]: { sort: order, nulls: 'last' } };
      
      // Always include priority and createdAt as secondary sorts
      return [
        primarySort as Prisma.TaskOrderByWithRelationInput,
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
