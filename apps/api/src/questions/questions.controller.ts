import { Body, ClassSerializerInterceptor, Controller, Param, Patch, Post, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { QuestionsService } from "./questions.service";
import { RequestWithUser } from "@griffin/types";
import { Question } from "@prisma/client";
import { CreateQuestionDto } from "./dto/create.dto";
import { UpdateQuestionDto } from "./dto/update.dto";

@Controller()
@UseGuards(AuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Post('notes/:noteId/questions')
  async create(
    @Req() request: RequestWithUser,
    @Param('noteId') noteId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ): Promise<Question> {
    return this.questionsService.create(request.user.id, noteId, createQuestionDto);
  }

  @Patch('notes/:noteId/questions/:questionId')
  async update(
    @Req() request: RequestWithUser,
    @Param('noteId') noteId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    return this.questionsService.update(request.user.id, questionId, noteId, updateQuestionDto);
  }
}
