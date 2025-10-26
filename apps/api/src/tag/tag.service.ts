import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTagDto } from "./dto/create-tag.dto";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { TagEntity } from "./entities/tag.entity";
import { plainToInstance } from "class-transformer";

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name);

  constructor(private prisma: PrismaService) {}

  async getAll(userId: string): Promise<TagEntity[]> {
    this.logger.debug(`Getting all tags for user ${userId}`);
    const tags = await this.prisma.tag.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    this.logger.debug(`Found ${tags.length} tags for user ${userId}`);
    return tags.map((tag) => plainToInstance(TagEntity, tag));
  }

  async getByObject(
    userId: string,
    objectType: 'note' | 'task',
    objectId: string
  ): Promise<TagEntity[]> {
    this.logger.debug(
      `Getting tags for user ${userId}, objectType: ${objectType}, objectId: ${objectId}`
    );
    const tags = await this.prisma.tag.findMany({
      where: {
        userId,
        objectType,
        objectId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    this.logger.debug(
      `Found ${tags.length} tags for ${objectType} ${objectId}`
    );
    return tags.map((tag) => plainToInstance(TagEntity, tag));
  }

  async create(
    userId: string,
    createTagDto: CreateTagDto
  ): Promise<TagEntity> {
    this.logger.debug(
      `Creating tag for user ${userId}, objectType: ${createTagDto.objectType}, objectId: ${createTagDto.objectId}`
    );

    // Verify that the object exists and belongs to the user
    await this.verifyObjectOwnership(
      userId,
      createTagDto.objectType,
      createTagDto.objectId
    );

    const tag = await this.prisma.tag.create({
      data: {
        name: createTagDto.name,
        objectType: createTagDto.objectType,
        objectId: createTagDto.objectId,
        userId,
      },
    });

    this.logger.debug(`Tag ID: ${tag.id} created for user ${userId}`);
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

    this.logger.debug(`Tag ${tagId} updated for user ${userId}`);
    return plainToInstance(TagEntity, tag);
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

    const tag = await this.prisma.tag.update({
      where: {
        id: tagId,
      },
      data: {
        deletedAt: new Date(),
      },
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