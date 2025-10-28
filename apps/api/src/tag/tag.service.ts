import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { TagEntity } from "./entities/tag.entity";
import { TagWithObjectsEntity } from "./entities/tag-with-objects.entity";
import { plainToInstance } from "class-transformer";
import { SearchService } from "../search/search.service";

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name);

  // Tailwind 300 and 700 color variants
  private readonly AVAILABLE_COLORS = [
    'bg-red-300', 'bg-red-700',
    'bg-orange-300', 'bg-orange-700',
    'bg-amber-300', 'bg-amber-700',
    'bg-yellow-300', 'bg-yellow-700',
    'bg-lime-300', 'bg-lime-700',
    'bg-green-300', 'bg-green-700',
    'bg-emerald-300', 'bg-emerald-700',
    'bg-teal-300', 'bg-teal-700',
    'bg-cyan-300', 'bg-cyan-700',
    'bg-sky-300', 'bg-sky-700',
    'bg-blue-300', 'bg-blue-700',
    'bg-indigo-300', 'bg-indigo-700',
    'bg-violet-300', 'bg-violet-700',
    'bg-purple-300', 'bg-purple-700',
    'bg-fuchsia-300', 'bg-fuchsia-700',
    'bg-pink-300', 'bg-pink-700',
    'bg-rose-300', 'bg-rose-700',
  ];

  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) {}

  async getAll(userId: string, search?: string): Promise<TagEntity[]> {
    this.logger.debug(`Getting all tags for user ${userId} with search: ${search}`);
    const tags = await this.prisma.tag.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }),
      },
      orderBy: {
        name: 'asc',
      },
    });
    this.logger.debug(`Found ${tags.length} tags for user ${userId}`);
    return tags.map((tag) => plainToInstance(TagEntity, tag));
  }

  async getById(userId: string, tagId: string): Promise<TagWithObjectsEntity> {
    this.logger.debug(`Getting tag ${tagId} for user ${userId}`);
    
    const tag = await this.prisma.tag.findFirst({
      where: {
        id: tagId,
        userId,
        deletedAt: null,
      },
      include: {
        objectTags: {
          select: {
            objectType: true,
            objectId: true,
          },
        },
      },
    });

    if (!tag) {
      this.logger.warn(`Tag ${tagId} not found for user ${userId}`);
      throw new NotFoundException('Tag not found');
    }

    // Fetch associated notes
    const noteIds = tag.objectTags
      .filter(ot => ot.objectType === 'note')
      .map(ot => ot.objectId);
    
    const notes = noteIds.length > 0 ? await this.prisma.note.findMany({
      where: {
        id: { in: noteIds },
        deletedAt: null,
        notebook: {
          userId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        notebookId: true,
        createdAt: true,
        updatedAt: true,
      },
    }) : [];

    // Fetch associated tasks
    const taskIds = tag.objectTags
      .filter(ot => ot.objectType === 'task')
      .map(ot => ot.objectId);
    
    const tasks = taskIds.length > 0 ? await this.prisma.task.findMany({
      where: {
        id: { in: taskIds },
        userId,
        deletedAt: null,
      },
    }) : [];

    return plainToInstance(TagWithObjectsEntity, {
      ...tag,
      notes,
      tasks,
    });
  }

  async getTagsForObject(
    userId: string,
    objectType: 'note' | 'task',
    objectId: string
  ): Promise<TagEntity[]> {
    this.logger.debug(
      `Getting tags for user ${userId}, objectType: ${objectType}, objectId: ${objectId}`
    );

    const objectTags = await this.prisma.objectTag.findMany({
      where: {
        objectType,
        objectId,
      },
      include: {
        tag: true,
      },
    });

    const tags = objectTags
      .map(ot => ot.tag)
      .filter(tag => tag !== null && tag.userId === userId && tag.deletedAt === null);

    this.logger.debug(
      `Found ${tags.length} tags for ${objectType} ${objectId}`
    );
    return tags.map((tag) => plainToInstance(TagEntity, tag));
  }

  private async getRandomColor(userId: string): Promise<string> {
    // Get all existing tag colors for this user
    const existingTags = await this.prisma.tag.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        color: true,
      },
    });

    const usedColors = new Set(existingTags.map(tag => tag.color));
    
    // Find unused colors
    const unusedColors = this.AVAILABLE_COLORS.filter(color => !usedColors.has(color));
    
    // If there are unused colors, pick one randomly
    if (unusedColors.length > 0) {
      return unusedColors[Math.floor(Math.random() * unusedColors.length)];
    }
    
    // If all colors are used, pick any random color
    return this.AVAILABLE_COLORS[Math.floor(Math.random() * this.AVAILABLE_COLORS.length)];
  }

  async create(
    userId: string,
    createTagDto: CreateTagDto
  ): Promise<TagEntity> {
    this.logger.debug(`Creating tag for user ${userId}, name: ${createTagDto.name}`);

    // Try to find existing tag first
    let tag = await this.prisma.tag.findUnique({
      where: {
        userId_name: {
          userId,
          name: createTagDto.name,
        },
      },
    });

    if (!tag) {
      // Generate color if not provided
      const color = createTagDto.color || await this.getRandomColor(userId);
      
      // Create new tag
      tag = await this.prisma.tag.create({
        data: {
          name: createTagDto.name,
          color,
          userId,
        },
      });

      // Add to Typesense
      await this.searchService.addObject({
        type: 'tag',
        id: tag.id,
        object: tag,
        userId,
      });

      this.logger.debug(`Tag ID: ${tag.id} created for user ${userId}`);
    } else {
      this.logger.debug(`Tag ID: ${tag.id} already exists for user ${userId}`);
    }

    return plainToInstance(TagEntity, tag);
  }

  async addToObject(
    userId: string,
    tagName: string,
    objectType: 'note' | 'task',
    objectId: string
  ): Promise<TagEntity> {
    this.logger.debug(
      `Adding tag "${tagName}" to ${objectType} ${objectId} for user ${userId}`
    );

    // Verify that the object exists and belongs to the user
    await this.verifyObjectOwnership(userId, objectType, objectId);

    // Find or create the tag
    let tag = await this.prisma.tag.findUnique({
      where: {
        userId_name: {
          userId,
          name: tagName,
        },
      },
    });

    if (!tag) {
      const color = await this.getRandomColor(userId);
      
      tag = await this.prisma.tag.create({
        data: {
          name: tagName,
          color,
          userId,
        },
      });

      // Add to Typesense
      await this.searchService.addObject({
        type: 'tag',
        id: tag.id,
        object: tag,
        userId,
      });
    }

    // Check if association already exists
    const existingAssociation = await this.prisma.objectTag.findFirst({
      where: {
        tagId: tag.id,
        objectType,
        objectId,
      },
    });

    if (!existingAssociation) {
      // Create the association
      await this.prisma.objectTag.create({
        data: {
          tagId: tag.id,
          objectType,
          objectId,
        },
      });
      this.logger.debug(
        `Associated tag ${tag.id} with ${objectType} ${objectId}`
      );
    } else {
      this.logger.debug(
        `Tag ${tag.id} already associated with ${objectType} ${objectId}`
      );
    }

    return plainToInstance(TagEntity, tag);
  }

  async update(
    userId: string,
    tagId: string,
    updateTagDto: UpdateTagDto
  ): Promise<TagEntity> {
    this.logger.debug(`Updating tag ${tagId} for user ${userId}`);

    // Verify tag exists and belongs to user
    const existingTag = await this.prisma.tag.findFirst({
      where: {
        id: tagId,
        userId,
        deletedAt: null,
      },
    });

    if (!existingTag) {
      this.logger.warn(`Tag ${tagId} not found for user ${userId}`);
      throw new NotFoundException('Tag not found');
    }

    const tag = await this.prisma.tag.update({
      where: {
        id: tagId,
      },
      data: updateTagDto,
    });

    // Update in Typesense
    await this.searchService.addObject({
      type: 'tag',
      id: tag.id,
      object: tag,
      userId,
    });

    this.logger.debug(`Tag ${tagId} updated for user ${userId}`);
    return plainToInstance(TagEntity, tag);
  }

  async removeFromObject(
    userId: string,
    tagId: string,
    objectType: 'note' | 'task',
    objectId: string
  ): Promise<void> {
    this.logger.debug(
      `Removing tag ${tagId} from ${objectType} ${objectId} for user ${userId}`
    );

    // Verify tag exists and belongs to user
    const tag = await this.prisma.tag.findFirst({
      where: {
        id: tagId,
        userId,
        deletedAt: null,
      },
    });

    if (!tag) {
      this.logger.warn(`Tag ${tagId} not found for user ${userId}`);
      throw new NotFoundException('Tag not found');
    }

    // Verify that the object exists and belongs to the user
    await this.verifyObjectOwnership(userId, objectType, objectId);

    // Remove the association
    await this.prisma.objectTag.deleteMany({
      where: {
        tagId,
        objectType,
        objectId,
      },
    });

    this.logger.debug(
      `Removed tag ${tagId} from ${objectType} ${objectId}`
    );
  }

  async delete(userId: string, tagId: string): Promise<TagEntity> {
    this.logger.debug(`Deleting tag ${tagId} for user ${userId}`);

    // Verify tag exists and belongs to user
    const existingTag = await this.prisma.tag.findFirst({
      where: {
        id: tagId,
        userId,
        deletedAt: null,
      },
    });

    if (!existingTag) {
      this.logger.warn(`Tag ${tagId} not found for user ${userId}`);
      throw new NotFoundException('Tag not found');
    }

    // Soft delete the tag (cascade will handle objectTags due to onDelete: Cascade)
    const tag = await this.prisma.tag.update({
      where: {
        id: tagId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Remove from Typesense
    await this.searchService.removeObject({
      type: 'tag',
      id: tagId,
    });

    this.logger.debug(`Tag ${tagId} deleted for user ${userId}`);
    return plainToInstance(TagEntity, tag);
  }

  async getObjectsByTags(
    userId: string,
    tagIds: string[],
    logicMode: 'OR' | 'AND' = 'OR'
  ): Promise<{ notes: any[]; tasks: any[] }> {
    this.logger.debug(
      `Getting objects for user ${userId} with tags ${tagIds.join(', ')} using ${logicMode} logic`
    );

    if (tagIds.length === 0) {
      return { notes: [], tasks: [] };
    }

    let noteIds: string[] = [];
    let taskIds: string[] = [];

    if (logicMode === 'OR') {
      // OR logic: Get all objects that have ANY of the specified tags
      const objectTags = await this.prisma.objectTag.findMany({
        where: {
          tagId: { in: tagIds },
        },
        select: {
          objectType: true,
          objectId: true,
        },
      });

      noteIds = objectTags
        .filter(ot => ot.objectType === 'note')
        .map(ot => ot.objectId);
      
      taskIds = objectTags
        .filter(ot => ot.objectType === 'task')
        .map(ot => ot.objectId);
    } else {
      // AND logic: Get objects that have ALL of the specified tags
      // For each object, count how many of the specified tags it has
      const objectTags = await this.prisma.objectTag.findMany({
        where: {
          tagId: { in: tagIds },
        },
        select: {
          objectType: true,
          objectId: true,
          tagId: true,
        },
      });

      // Group by objectType and objectId, count unique tags
      const objectTagCounts = new Map<string, Set<string>>();
      
      for (const ot of objectTags) {
        const key = `${ot.objectType}:${ot.objectId}`;
        if (!objectTagCounts.has(key)) {
          objectTagCounts.set(key, new Set());
        }
        objectTagCounts.get(key)!.add(ot.tagId);
      }

      // Filter to only objects that have all specified tags
      for (const [key, tagSet] of objectTagCounts.entries()) {
        if (tagSet.size === tagIds.length) {
          const [objectType, objectId] = key.split(':');
          if (objectType === 'note') {
            noteIds.push(objectId);
          } else if (objectType === 'task') {
            taskIds.push(objectId);
          }
        }
      }
    }

    // Fetch notes
    const notes = noteIds.length > 0 ? await this.prisma.note.findMany({
      where: {
        id: { in: noteIds },
        deletedAt: null,
        notebook: {
          userId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        notebookId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }) : [];

    // Fetch tasks
    const tasks = taskIds.length > 0 ? await this.prisma.task.findMany({
      where: {
        id: { in: taskIds },
        userId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    }) : [];

    this.logger.debug(
      `Found ${notes.length} notes and ${tasks.length} tasks for user ${userId}`
    );

    return { notes, tasks };
  }

  private async verifyObjectOwnership(
    userId: string,
    objectType: 'note' | 'task',
    objectId: string
  ): Promise<void> {
    if (objectType === 'note') {
      const note = await this.prisma.note.findFirst({
        where: {
          id: objectId,
          notebook: {
            userId,
          },
          deletedAt: null,
        },
      });

      if (!note) {
        this.logger.warn(
          `Note ${objectId} not found for user ${userId}`
        );
        throw new NotFoundException('Note not found');
      }
    } else if (objectType === 'task') {
      const task = await this.prisma.task.findFirst({
        where: {
          id: objectId,
          userId,
          deletedAt: null,
        },
      });

      if (!task) {
        this.logger.warn(
          `Task ${objectId} not found for user ${userId}`
        );
        throw new NotFoundException('Task not found');
      }
    }
  }
}