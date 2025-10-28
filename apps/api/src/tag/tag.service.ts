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
      // Create new tag
      tag = await this.prisma.tag.create({
        data: {
          name: createTagDto.name,
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
      tag = await this.prisma.tag.create({
        data: {
          name: tagName,
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