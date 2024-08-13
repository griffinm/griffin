import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TaskEntity } from './dto/task.entity';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}
}