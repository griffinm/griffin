import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from '../prisma/prisma.service';
import { CreateDto } from "./dto/create.dto";
import { UpdateDto } from "./dto/update.dto";
import { SearchService } from "../search/search.service";
import { associateTasks } from "./associateTasks";
import { associateQuestions } from "./associateQuestions";
import { Note } from "@prisma/client";

@Injectable()
export class NoteService {
  private readonly logger = new Logger(NoteService.name);

  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) {}

  /**
   * Fetch tags for a list of notes
   */
  private async addTagsToNotes(notes: any[]): Promise<any[]> {
    if (notes.length === 0) return notes;

    const noteIds = notes.map(note => note.id);
    
    // Fetch all object tags for these notes
    const objectTags = await this.prisma.objectTag.findMany({
      where: {
        objectType: 'note',
        objectId: { in: noteIds },
      },
      include: {
        tag: true,
      },
    });

    // Group tags by note ID (filter out deleted tags)
    const tagsByNoteId = objectTags.reduce((acc, ot) => {
      if (!acc[ot.objectId]) {
        acc[ot.objectId] = [];
      }
      if (ot.tag && ot.tag.deletedAt === null) {
        acc[ot.objectId].push(ot.tag);
      }
      return acc;
    }, {} as Record<string, any[]>);

    // Add tags to each note
    return notes.map(note => ({
      ...note,
      tags: tagsByNoteId[note.id] || [],
    }));
  }

  /**
   * Truncate HTML content safely for preview purposes
   * Strips HTML tags and truncates to specified length
   */
  private truncateContentForPreview(content: string | null, maxLength = 300): string | null {
    if (!content) return content;
    
    // Simple HTML tag stripping (basic implementation)
    const stripped = content.replace(/<[^>]*>/g, '');
    
    // Truncate if needed
    if (stripped.length > maxLength) {
      return stripped.substring(0, maxLength) + '...';
    }
    
    return stripped;
  }

  async findAllForUser(userId: string) {
    const notes = await this.prisma.note.findMany({
      where: {
        deletedAt: null,
        notebook: {
          user: { id: userId },
          deletedAt: null,
        },
      },
    });

    // Truncate content for preview
    const notesWithTruncated = notes.map(note => ({
      ...note,
      content: this.truncateContentForPreview(note.content),
    }));

    // Add tags
    return this.addTagsToNotes(notesWithTruncated);
  }

  async recentNotes(userId: string) {
    const notes = await this.prisma.note.findMany({
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

    // Truncate content for preview
    const notesWithTruncated = notes.map(note => ({
      ...note,
      content: this.truncateContentForPreview(note.content),
    }));

    // Add tags
    return this.addTagsToNotes(notesWithTruncated);
  }
  
  async findAllForNotebook(notebookId: string, userId: string) {
    const notes = await this.prisma.note.findMany({
      where: {
        notebook: { id: notebookId, user: { id: userId } },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        content: true, // load content for preview
        createdAt: true,
        updatedAt: true,
        notebookId: true,
      },
    });

    // Truncate content for preview
    const notesWithTruncated = notes.map(note => ({
      ...note,
      content: this.truncateContentForPreview(note.content),
    }));

    // Add tags
    return this.addTagsToNotes(notesWithTruncated);
  }

  async findOneForUser(id: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: {
        id,
        notebook: {
          user: { id: userId },
        },
      },
    });

    if (!note) return note;

    // Add tags
    const notesWithTags = await this.addTagsToNotes([note]);
    return notesWithTags[0];
  }

  async update(id: string, data: UpdateDto, userId: string) {
    this.logger.debug(`Updating note ${id.substring(0, 7)} for user ${userId.substring(0, 7)}`);
    this.logger.debug(`Update data: ${JSON.stringify(data)}`);

    // First verify the note belongs to the user
    const existingNote = await this.prisma.note.findFirst({
      where: {
        id,
        notebook: {
          user: { id: userId },
        },
      },
    });

    if (!existingNote) {
      throw new Error('Note not found or access denied');
    }

    // If moving to a new notebook, verify the target notebook belongs to the user
    if (data.notebookId && data.notebookId !== existingNote.notebookId) {
      const targetNotebook = await this.prisma.notebook.findFirst({
        where: {
          id: data.notebookId,
          user: { id: userId },
        },
      });

      if (!targetNotebook) {
        throw new Error('Target notebook not found or access denied');
      }
    }

    // Now update the note
    const updatedNote = await this.prisma.note.update({
      where: { id },
      data,
    });

    this.searchService.addNote(updatedNote, userId);
    associateTasks(updatedNote, userId, this.prisma, this.logger);
    associateQuestions(updatedNote, userId, this.prisma, this.logger);

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
