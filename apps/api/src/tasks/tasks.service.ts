import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Task } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { UpdateTaskDto } from './dto/update.dto';
import { NewTaskDto } from './dto/new.dto';
@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async filter(userId: string, filter: Partial<Task>): Promise<Task[]> {
    const tasks = await this.prisma.task.findMany({
      where: { 
        userId, 
        ...filter,
        deletedAt: null,
      },
      orderBy: { dueDate: 'asc' },
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
