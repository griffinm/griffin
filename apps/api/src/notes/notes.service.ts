import { Injectable } from "@nestjs/common";
import { PrismaService } from '../prisma.service';

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
}
