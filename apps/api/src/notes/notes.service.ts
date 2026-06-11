import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from '../prisma/prisma.service';
import { CreateDto } from "./dto/create.dto";
import { UpdateDto } from "./dto/update.dto";
import { SearchService } from "../search/search.service";
import { associateTasks } from "./associateTasks";
import { associateQuestions } from "./associateQuestions";
import { associateDropdownInstances } from "./associateDropdownInstances";
import { associateDataTables } from "./associateDataTables";
import { applyNotebookDefaultTags } from "./applyNotebookDefaultTags";
import { buildNotePreview } from "./buildNotePreview";
import { Prisma, Tag } from "@prisma/client";

// Fields returned by list endpoints — note `content` is intentionally omitted so the
// large column never leaves the database for previews; `preview` carries the excerpt.
const noteListSelect = {
  id: true,
  title: true,
  preview: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  notebookId: true,
  pinnedAt: true,
} satisfies Prisma.NoteSelect;

@Injectable()
export class NoteService {
  private readonly logger = new Logger(NoteService.name);

  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) {}

  private async addTagsToNotes<T extends { id: string }>(notes: T[]): Promise<(T & { tags: Tag[] })[]> {
    if (notes.length === 0) return notes as (T & { tags: Tag[] })[];

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
    }, {} as Record<string, Tag[]>);

    // Add tags to each note
    return notes.map(note => ({
      ...note,
      tags: tagsByNoteId[note.id] || [],
    }));
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
      select: noteListSelect,
    });

    return this.addTagsToNotes(notes);
  }

  async recentNotes(userId: string, limit = 5) {
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
      take: limit,
      select: noteListSelect,
    });

    return this.addTagsToNotes(notes);
  }

  async findAllForNotebook(notebookId: string, userId: string) {
    const notes = await this.prisma.note.findMany({
      where: {
        notebook: { id: notebookId, user: { id: userId } },
        deletedAt: null,
      },
      select: noteListSelect,
    });

    return this.addTagsToNotes(notes);
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

    // Bump the version only when the content actually changes
    const contentChanged =
      data.content !== undefined && data.content !== existingNote.content;

    // Now update the note
    const updatedNote = await this.prisma.note.update({
      where: { id },
      data: {
        ...data,
        ...(contentChanged ? { version: { increment: 1 } } : {}),
        ...(data.content !== undefined ? { preview: buildNotePreview(data.content) } : {}),
      },
    });

    this.searchService.addNote(updatedNote, userId);
    associateTasks(updatedNote, userId, this.prisma, this.logger);
    associateQuestions(updatedNote, userId, this.prisma, this.logger);
    associateDropdownInstances(updatedNote, this.prisma, this.logger);
    associateDataTables(updatedNote, this.prisma, this.logger);

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
        preview: buildNotePreview(data.content ?? null),
      },
    });

    this.searchService.addNote(note, userId);

    // Seed default tags inherited from the notebook and its ancestors. Awaited (unlike
    // the fire-and-forget associate* calls in update) so the tags are present when the
    // client refetches the note.
    await applyNotebookDefaultTags(note, this.prisma, this.logger);

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
