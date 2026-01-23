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

  async getDescendantNotebookIds(notebookId: string, userId: string): Promise<string[]> {
    const allNotebooks = await this.getNotebooksForUser(userId);
    const result: string[] = [notebookId];

    const collectDescendants = (parentId: string) => {
      const children = allNotebooks.filter(nb => nb.parentId === parentId);
      for (const child of children) {
        result.push(child.id);
        collectDescendants(child.id);
      }
    };

    collectDescendants(notebookId);
    return result;
  }
}
