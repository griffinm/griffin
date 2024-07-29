import { 
  Body,
  Controller, 
  Get, 
  Param, 
  Patch, 
  Post, 
  Req, 
  UseGuards,
  Delete,
 } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { NoteService } from './notes.service';
import { NoteEntity } from './dto/note.entity';
import { CreateDto } from './dto/create.dto';
import { UpdateDto } from './dto/update.dto';

@Controller('notes')
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private noteService: NoteService) {}

  @Get()
  async findAll(@Req() request: any): Promise<NoteEntity[]> {
    return this.noteService.findAllForUser(request.user.id);
  }

  @Get(':id')
  async findOne(
    @Req() request: any,
    @Param('id') id: string,
  ): Promise<NoteEntity> {
    return this.noteService.findOneForUser(Number(id), request.user.id);
  }

  // @Post()
  // async create(
  //   @Req() request: any,
  //   @Body() body: CreateDto,
  // ): Promise<NoteEntity> {
  //   return this.noteService.create(body, request.user.id);
  // }

  @Patch(':id')
  async update(
    @Req() request: any,
    @Param('id') id: string,
    @Body() body: UpdateDto,
  ): Promise<NoteEntity> {
    return this.noteService.update(Number(id), body, request.user.id);
  }

  @Delete(':id')
  async delete(
    @Req() request: any,
    @Param('id') id: string,
  ): Promise<void> {
    this.noteService.delete(Number(id), request.user.id);
  }
}
