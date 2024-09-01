import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from '../prisma/prisma.service';
import { CreateDto } from "./dto/create.dto";
import { UpdateDto } from "./dto/update.dto";
import { SearchResult, SearchResultQueryResult } from "@griffin/types";
import { SearchService } from "../search/search.service";

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

  async search(
    query: string,
    userId: string,
  ): Promise<SearchResult[]> {
    const results = await this.prisma.$queryRaw`SELECT * FROM search_notes(${query}, ${userId})` as SearchResultQueryResult[];
    const formattedResults = results.map((result) => {
      return {
        noteId: result.note_id,
        noteTitle: result.note_title,
        notebookTitle: result.notebook_title,
        notebookId: result.notebook_id,
        tsRank: result.ts_rank,
        trigramSimilarity: result.trigram_similarity,
      }
    })
    return formattedResults;
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
    this.logger.debug(`Updating note ${id} for user ${userId}`);

    const updatedNote = await this.prisma.note.update({
      where: { id, notebook: { user: { id: userId } } },
      data,
    });

    await this.searchService.addNote(updatedNote, userId);

    return updatedNote;
  }

  async create(data: CreateDto, notebookId: string, userId: string) {
    this.logger.debug(`Creating note for user ${userId}`);

    const notebook = await this.prisma.notebook.findFirst({
      where: {
        id: notebookId,
        user: { id: userId },
      },
    });
    
    return await this.prisma.note.create({
      data: {
        ...data,
        notebookId: notebook.id,
      },
    });
  }

  async delete(id: string, userId: string) {
    this.logger.debug(`Deleting note ${id} for user ${userId}`);

    return await this.prisma.note.update({
      where: { id, notebook: { user: { id: userId } } },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
