import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotebookEntity } from './dto/notebook.entity';
import { CreateDto } from './dto/create.dto';
import { UpdateDto } from './dto/update.dto';

@Injectable()
export class NotebookService {
  constructor(private prisma: PrismaService) {}

  async getNotebook(notebookId: string, userId: string): Promise<NotebookEntity> {
    return this.prisma.notebook.findUnique({
      where: {
        id: notebookId,
        userId,
      },
    });
  }

  async getNotebooksForUser(userId: string): Promise<NotebookEntity[]> {
    return this.prisma.notebook.findMany({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }

  async updateNotebook(
    userId: string,
    notebookId: string,
    dto: UpdateDto,
  ): Promise<NotebookEntity> {
    return this.prisma.notebook.update({
      where: {
        id: notebookId,
        userId,
      },
      data: {
        ...dto,
      },
    });
  }

  async createNotebook(userId: string, dto: CreateDto): Promise<NotebookEntity> {
    return this.prisma.notebook.create({
      data: {
        ...dto,
        userId,
      },
    });
  }
  
  async deleteNotebook(userId: string, notebookId: string): Promise<NotebookEntity> {
    return this.prisma.notebook.update({
      where: {
        id: notebookId,
        userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
