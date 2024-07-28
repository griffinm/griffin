import {
  Controller,
  UseGuards,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  Post,
  Body,
  Param,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { NotebookEntity } from './dto/notebook.entity';
import { NotebookService } from './notebook.service';
import { CreateDto } from './dto/create.dto';
import { NoteService } from '../notes/notes.service';
import { NoteEntity } from '../notes/dto/note.entity';
import { UpdateDto } from './dto/update.dto';

@Controller('notebooks')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AuthGuard)
export class NotebooksController {
  constructor(
    private notebookService: NotebookService,
    private noteService: NoteService,
  ) {}

  @Get()
  async findAll(@Req() request: any): Promise<NotebookEntity[]> {
    return this.notebookService.getNotebooksForUser(request.user.id);
  }

  @Get("/:id/notes")
  async findAllForNotebook(
    @Req() request: any,
    @Param('id') id: string,
  ): Promise<NoteEntity[]> {
    return this.noteService.findAllForNotebook(Number(id), request.user.id);
  }

  @Patch("/:id")
  async update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() dto: UpdateDto,
  ): Promise<NotebookEntity> {
    return this.notebookService.updateNotebook(request.user.id, Number(id), dto);
  }

  @Post()
  async create(
    @Req() request: any,
    @Body() dto: CreateDto,
  ): Promise<NotebookEntity> {
    return this.notebookService.createNotebook(request.user.id, dto);
  }
}
