import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotebookEntity } from './dto/notebook.entity';
import { CreateDto } from './dto/create.dto';

@Injectable()
export class NotebookService {
  constructor(private prisma: PrismaService) {}

  async getNotebooksForUser(userId: number): Promise<NotebookEntity[]> {
    return this.prisma.notebook.findMany({
      where: {
        userId,
      },
    });
  }

  async createNotebook(userId: number, dto: CreateDto): Promise<NotebookEntity> {
    return this.prisma.notebook.create({
      data: {
        ...dto,
        userId,
      },
    });
  }
}
