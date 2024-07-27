import {
  Controller,
  UseGuards,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  Post,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { NotebookEntity } from './dto/notebook.entity';
import { NotebookService } from './notebook.service';
import { CreateDto } from './dto/create.dto';

@Controller('notebooks')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard)
export class NotebooksController {
  constructor(
    private notebookService: NotebookService
  ) {}

  @Get()
  async findAll(@Req() request: any): Promise<NotebookEntity[]> {
    return this.notebookService.getNotebooksForUser(request.user.id);
  }

  @Post()
  async create(
    @Req() request: any,
    @Body() dto: CreateDto,
  ): Promise<NotebookEntity> {
    return this.notebookService.createNotebook(request.user.id, dto);
  }
}
