import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create.dto';
import { UpdateQuestionDto } from './dto/update.dto';
import { Question } from '@prisma/client';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  async create(
    userId: string,
    noteId: string,
    createQuestionDto: CreateQuestionDto,
  ): Promise<Question> {
    this.logger.debug(`Creating question for user ${userId}`);
    const note = await this.prisma.note.findFirst({
      where: {
        id: noteId,
        notebook: {
          userId,
        },
      },
    });

    if (!note) {
      this.logger.warn(`Note not found for user ${userId} and noteId ${noteId}`);
      throw new NotFoundException('Note not found');
    }

    const question = await this.prisma.question.create({
      data: {
        ...createQuestionDto,
        noteId,
        userId,
      },
    });

    this.logger.debug(`Question ID: ${question.id} created for user ${userId}`);
    return question;
  }

  async delete(
    userId: string,
    questionId: string,
  ): Promise<Question> {
    this.logger.debug(`Deleting question ${questionId} for user ${userId}`);
    const question = await this.prisma.question.update({
      where: {
        id: questionId,
        userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    this.logger.debug(`Question ${questionId} deleted for user ${userId}`);

    return question;
  }

  async update(
    userId: string,
    questionId: string,
    noteId: string,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    this.logger.debug(`Updating question ${questionId} for user ${userId} noteId ${noteId}`);
    const question = await this.prisma.question.update({
      where: {
        id: questionId,
        userId,
        noteId,
      },
      data: updateQuestionDto,
    });
    this.logger.debug(`Question ${questionId} updated for user ${userId}`);
    return question;
  }
}
