import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Task } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { UpdateTaskDto } from './dto/update.dto';
import { NewTaskDto } from './dto/new.dto';
import { FilterDto } from './dto/filter.dto';
import { TaskEntity } from './dto/task.entity';
import { SearchService } from '../search/search.service';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
    @Inject(forwardRef(() => LlmService))
    private llmService: LlmService,
  ) {}

  /**
   * Fetch tags for a list of tasks
   */
  private async addTagsToTasks(tasks: any[]): Promise<any[]> {
    if (tasks.length === 0) return tasks;

    const taskIds = tasks.map(task => task.id);
    
    // Fetch all object tags for these tasks
    const objectTags = await this.prisma.objectTag.findMany({
      where: {
        objectType: 'task',
        objectId: { in: taskIds },
      },
      include: {
        tag: true,
      },
    });

    // Group tags by task ID (filter out deleted tags)
    const tagsByTaskId = objectTags.reduce((acc, ot) => {
      if (!acc[ot.objectId]) {
        acc[ot.objectId] = [];
      }
      if (ot.tag && ot.tag.deletedAt === null) {
        acc[ot.objectId].push(ot.tag);
      }
      return acc;
    }, {} as Record<string, any[]>);

    // Add tags to each task
    return tasks.map(task => ({
      ...task,
      tags: tagsByTaskId[task.id] || [],
    }));
  }

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

    // Handle tag filtering
    let tagFilter = {};
    if (filter.tags) {
      const tagIds = filter.tags.split(',').map(t => t.trim());
      // Filter tasks that have at least one of the specified tags
      tagFilter = {
        id: {
          in: await this.prisma.objectTag.findMany({
            where: {
              objectType: 'task',
              tagId: { in: tagIds },
            },
            select: { objectId: true },
          }).then(results => results.map(r => r.objectId)),
        },
      };
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
        ...tagFilter,
      },
      orderBy: this.ordering(filter.sortBy, filter.sortOrder, filter.status),
      take: filter.resultsPerPage,
      skip: (filter.page - 1) * filter.resultsPerPage,
    });
    
    // Add tags to tasks
    const tasksWithTags = await this.addTagsToTasks(tasks);
    
    const objs = tasksWithTags.map((task) => {
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
    
    // Add tags
    const tasksWithTags = await this.addTagsToTasks([task]);
    return tasksWithTags[0] as Task;
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
    
    // Add tags
    const tasksWithTags = await this.addTagsToTasks(tasks);
    return tasksWithTags as Task[];
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
    
    // Prepare the data to update
    const updateData: any = { ...task };
    
    // Automatically set/unset completedAt based on status changes
    if (task.status && task.status !== existingTask.status) {
      if (task.status === 'COMPLETED' && !updateData.completedAt) {
        // Task is being marked as completed, set completedAt to now
        updateData.completedAt = new Date();
      } else if (task.status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
        // Task is being unmarked from completed, clear completedAt
        updateData.completedAt = null;
      }
    }
    
    // Update the task
    const updatedTask = await this.prisma.task.update({
      where: { id, userId },
      data: updateData,
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

    // Add the task to the search index
    this.searchService.addObject({
      userId,
      type: 'task',
      id: existingTask.id,
      object: existingTask,
    })
    
    return updatedTask;
  }

  async create(userId: string, task: NewTaskDto): Promise<Task> {
    this.logger.debug("Adding new task")
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

    this.searchService.addObject({
      userId,
      type: 'task',
      id: createdTask.id,
      object: createdTask,
    })
    
    return createdTask;
  }

  async enhanceTask(id: string, userId: string): Promise<{
    enhancedDescription: string;
    resources: Array<{ title: string; url: string; snippet: string }>;
  }> {
    // Get the task and verify ownership
    const task = await this.getById(id, userId);

    // Call LLM service to enhance the task
    return this.llmService.enhanceTaskDescription(task);
  }

  private ordering(sortBy?: string, sortOrder?: string, status?: string): Prisma.TaskOrderByWithRelationInput[] {
    // If specific sort criteria provided, use it as primary sort
    if (sortBy) {
      const order = (sortOrder || 'asc') as 'asc' | 'desc';
      const primarySort = { [sortBy]: { sort: order, nulls: 'last' } };
      
      // For completed status with completedAt sort, use createdAt desc as secondary
      if (sortBy === 'completedAt' && (status === 'COMPLETED' || status?.includes('COMPLETED'))) {
        return [
          primarySort as Prisma.TaskOrderByWithRelationInput,
          { createdAt: 'desc' },
        ];
      }
      
      // Always include priority and createdAt as secondary sorts for other cases
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
        { createdAt: 'desc' },
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
