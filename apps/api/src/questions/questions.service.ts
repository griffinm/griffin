import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create.dto';
import { UpdateQuestionDto } from './dto/update.dto';
import { QuestionEntity } from './dto/question.entity';
import { plainToInstance } from 'class-transformer';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  async getMany(userId: string, includeAnswered = false): Promise<QuestionEntity[]> {
    this.logger.debug(`Getting questions for user ${userId}, includeAnswered: ${includeAnswered}`);
    const questions = await this.prisma.question.findMany({
      where: {
        userId,
        deletedAt: null,
        note: {
          deletedAt: null,
        },
        // ...this.getAnsweredWhereClause(includeAnswered),
      },
    });
    this.logger.debug(`Found ${questions.length} questions for user ${userId}`);

    const objs = questions.map((question) => {
      return plainToInstance(QuestionEntity, question);
    });
    return objs;
  }

  async create(
    userId: string,
    noteId: string,
    createQuestionDto: CreateQuestionDto,
  ): Promise<QuestionEntity> {
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
    return plainToInstance(QuestionEntity, question);
  }

  async delete(
    userId: string,
    questionId: string,
  ): Promise<QuestionEntity> {
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

    return plainToInstance(QuestionEntity, question);
  }

  async update(
    userId: string,
    questionId: string,
    noteId: string,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<QuestionEntity> {
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
    return plainToInstance(QuestionEntity, question);
  }

  private getAnsweredWhereClause(includeAnswered: boolean): Prisma.QuestionWhereInput {
    if (includeAnswered) {
      return {};
    }
    this.logger.debug('Getting unanswered questions');
    return {
      OR: [
        { answer: null },
        { answer: '' },
      ],
    };
  }
}
