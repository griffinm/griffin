import { Injectable } from "@nestjs/common";
import { PrismaService } from '../prisma.service';
import { CreateDto } from "./dto/create.dto";
import { UpdateDto } from "./dto/update.dto";

@Injectable()
export class NoteService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: number) {
    return await this.prisma.note.findMany({
      where: {
        notebook: {
          user: { id: userId },
        },
      },
    });
  }

  async findAllForNotebook(notebookId: number, userId: number) {
    return await this.prisma.note.findMany({
      where: {
        notebook: { id: notebookId, user: { id: userId } },
      },
    });
  }

  async findOneForUser(id: number, userId: number) {
    return await this.prisma.note.findFirst({
      where: {
        id,
        notebook: {
          user: { id: userId },
        },
      },
    })
  }

  async update(id: number, data: UpdateDto, userId: number) {
    return await this.prisma.note.update({
      where: { id, notebook: { user: { id: userId } } },
      data,
    });
  }

  // async create(data: CreateDto, userId: number) {
  //   return await this.prisma.note.create({
  //     data: {
  //       ...data,
  //     },
  //   });
  // }
}
