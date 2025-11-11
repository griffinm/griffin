import { Body, ClassSerializerInterceptor, Controller, Get, Param, ParseBoolPipe, Patch, Post, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { QuestionsService } from "./questions.service";
import type { RequestWithUser } from "@griffin/types";
import { CreateQuestionDto } from "./dto/create.dto";
import { UpdateQuestionDto } from "./dto/update.dto";
import { QuestionEntity } from "./dto/question.entity";

@Controller()
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Get('/questions')
  async getAll(
    @Req() request: RequestWithUser,
    @Query('includeAnswered', new ParseBoolPipe({ optional: true })) includeAnswered = false,
  ): Promise<QuestionEntity[]> {
    // return [];
    return this.questionsService.getMany(request.user.id, includeAnswered);
  }

  @Post('notes/:noteId/questions')
  async create(
    @Req() request: RequestWithUser,
    @Param('noteId') noteId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ): Promise<QuestionEntity> {
    return this.questionsService.create(request.user.id, noteId, createQuestionDto);
  }

  @Patch('notes/:noteId/questions/:questionId')
  async update(
    @Req() request: RequestWithUser,
    @Param('noteId') noteId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ): Promise<QuestionEntity> {
    return this.questionsService.update(request.user.id, questionId, noteId, updateQuestionDto);
  }
}
