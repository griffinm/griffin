import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { NotebookEntity } from './dto/notebook.entity';
import { CreateDto } from './dto/create.dto';
import { UpdateDto } from './dto/update.dto';
import { TagEntity } from '../tag/entities/tag.entity';

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

  // Walk the parent chain upward. Returns [self, ...ancestors].
  async getAncestorNotebookIds(notebookId: string, userId: string): Promise<string[]> {
    const allNotebooks = await this.getNotebooksForUser(userId);
    const byId = new Map(allNotebooks.map(nb => [nb.id, nb]));
    const result: string[] = [];

    let current = byId.get(notebookId);
    while (current) {
      result.push(current.id);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }

    return result;
  }

  // Tags configured directly as defaults on this notebook (excludes inherited).
  async getDefaultTags(notebookId: string, userId: string): Promise<TagEntity[]> {
    await this.assertNotebookOwnership(notebookId, userId);

    const defaults = await this.prisma.notebookDefaultTag.findMany({
      where: { notebookId },
      include: { tag: true },
    });

    return defaults
      .map(d => d.tag)
      .filter(tag => tag && tag.deletedAt === null)
      .map(tag => plainToInstance(TagEntity, tag));
  }

  async addDefaultTag(userId: string, notebookId: string, tagId: string): Promise<TagEntity[]> {
    await this.assertNotebookOwnership(notebookId, userId);
    await this.assertTagOwnership(tagId, userId);

    // Idempotent: do nothing if this tag is already a default for the notebook.
    const existing = await this.prisma.notebookDefaultTag.findUnique({
      where: { notebookId_tagId: { notebookId, tagId } },
    });
    if (!existing) {
      await this.prisma.notebookDefaultTag.create({
        data: { notebookId, tagId },
      });
    }

    // Seed the tag onto every existing descendant note (1 instance each).
    const noteIds = await this.getDescendantNoteIds(notebookId, userId);
    if (noteIds.length > 0) {
      const alreadyTagged = await this.prisma.objectTag.findMany({
        where: { tagId, objectType: 'note', objectId: { in: noteIds } },
        select: { objectId: true },
      });
      const taggedSet = new Set(alreadyTagged.map(ot => ot.objectId));
      const toCreate = noteIds.filter(id => !taggedSet.has(id));
      if (toCreate.length > 0) {
        await this.prisma.objectTag.createMany({
          data: toCreate.map(objectId => ({ tagId, objectType: 'note', objectId })),
        });
      }
    }

    return this.getDefaultTags(notebookId, userId);
  }

  async removeDefaultTag(userId: string, notebookId: string, tagId: string): Promise<TagEntity[]> {
    await this.assertNotebookOwnership(notebookId, userId);

    await this.prisma.notebookDefaultTag.deleteMany({
      where: { notebookId, tagId },
    });

    // Smart unseed: a descendant note keeps the tag if any OTHER notebook in its
    // ancestor chain still designates it as a default.
    const stillDefaulting = await this.prisma.notebookDefaultTag.findMany({
      where: { tagId, notebook: { userId } },
      select: { notebookId: true },
    });
    const stillDefaultingSet = new Set(stillDefaulting.map(d => d.notebookId));

    const descendantNotebookIds = await this.getDescendantNotebookIds(notebookId, userId);
    const notes = await this.prisma.note.findMany({
      where: { notebookId: { in: descendantNotebookIds }, deletedAt: null },
      select: { id: true, notebookId: true },
    });

    // Cache ancestor lookups per notebook to avoid recomputing for sibling notes.
    const ancestorCache = new Map<string, string[]>();
    const noteIdsToUntag: string[] = [];
    for (const note of notes) {
      let ancestors = ancestorCache.get(note.notebookId);
      if (!ancestors) {
        ancestors = await this.getAncestorNotebookIds(note.notebookId, userId);
        ancestorCache.set(note.notebookId, ancestors);
      }
      const stillRequired = ancestors.some(id => stillDefaultingSet.has(id));
      if (!stillRequired) {
        noteIdsToUntag.push(note.id);
      }
    }

    if (noteIdsToUntag.length > 0) {
      await this.prisma.objectTag.deleteMany({
        where: { tagId, objectType: 'note', objectId: { in: noteIdsToUntag } },
      });
    }

    return this.getDefaultTags(notebookId, userId);
  }

  private async getDescendantNoteIds(notebookId: string, userId: string): Promise<string[]> {
    const notebookIds = await this.getDescendantNotebookIds(notebookId, userId);
    const notes = await this.prisma.note.findMany({
      where: { notebookId: { in: notebookIds }, deletedAt: null },
      select: { id: true },
    });
    return notes.map(n => n.id);
  }

  private async assertNotebookOwnership(notebookId: string, userId: string): Promise<void> {
    const notebook = await this.prisma.notebook.findFirst({
      where: { id: notebookId, userId, deletedAt: null },
    });
    if (!notebook) {
      throw new NotFoundException('Notebook not found');
    }
  }

  private async assertTagOwnership(tagId: string, userId: string): Promise<void> {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, userId, deletedAt: null },
    });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
  }
}
