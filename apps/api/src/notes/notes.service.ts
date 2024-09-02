import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from '../prisma/prisma.service';
import { CreateDto } from "./dto/create.dto";
import { UpdateDto } from "./dto/update.dto";
import { SearchService } from "../search/search.service";
import { associateTasks } from "./associateTasks";

@Injectable()
export class NoteService {
  private readonly logger = new Logger(NoteService.name);

  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) {}

  async findAllForUser(userId: string) {
    return await this.prisma.note.findMany({
      where: {
        deletedAt: null,
        notebook: {
          user: { id: userId },
          deletedAt: null,
        },
      },
    });
  }

  async recentNotes(userId: string) {
    return await this.prisma.note.findMany({
      where: {
        deletedAt: null,
        notebook: {
          user: { id: userId },
          deletedAt: null,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });
  }
  
  async findAllForNotebook(notebookId: string, userId: string) {
    return await this.prisma.note.findMany({
      where: {
        notebook: { id: notebookId, user: { id: userId } },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        content: false, // do not load the content when selecting for the list view
        createdAt: true,
        updatedAt: true,
        notebookId: true,
      },
    });
  }

  async findOneForUser(id: string, userId: string) {
    return await this.prisma.note.findFirst({
      where: {
        id,
        notebook: {
          user: { id: userId },
        },
      },
    })
  }

  async update(id: string, data: UpdateDto, userId: string) {
    this.logger.debug(`Updating note ${id.substring(0, 7)} for user ${userId.substring(0, 7)}`);

    const updatedNote = await this.prisma.note.update({
      where: { id, notebook: { user: { id: userId } } },
      data,
    });

    this.searchService.addNote(updatedNote, userId);
    associateTasks(updatedNote, userId, this.prisma, this.logger);

    return updatedNote;
  }

  async create(data: CreateDto, notebookId: string, userId: string) {
    this.logger.debug(`Creating note for user ${userId.substring(0, 7)}`);

    this.logger.debug(`Locating notebook ${notebookId.substring(0, 7)} for user ${userId.substring(0, 7)}`);
    const notebook = await this.prisma.notebook.findFirst({
      where: {
        id: notebookId,
        user: { id: userId },
      },
    });
    
    const note =  await this.prisma.note.create({
      data: {
        ...data,
        notebookId: notebook.id,
      },
    });

    this.searchService.addNote(note, userId);
    this.logger.debug(`Note ${note.id.substring(0, 7)} created`);

    return note;
  }

  async delete(id: string, userId: string) {
    this.logger.debug(`Deleting note ${id.substring(0, 7)} for user ${userId.substring(0, 7)}`);

    this.searchService.removeNote(id);

    return await this.prisma.note.update({
      where: { id, notebook: { user: { id: userId } } },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
