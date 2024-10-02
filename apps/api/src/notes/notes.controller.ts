import { 
  Body,
  Controller, 
  Get, 
  Param, 
  Patch, 
  Req, 
  UseGuards,
  Delete,
 } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { NoteService } from './notes.service';
import { NoteEntity } from './dto/note.entity';
import { UpdateDto } from './dto/update.dto';
import { RequestWithUser } from '@griffin/types';

@Controller('notes')
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private noteService: NoteService) {}

  @Get()
  async findAll(@Req() request: RequestWithUser): Promise<NoteEntity[]> {
    return this.noteService.findAllForUser(request.user.id);
  }

  @Get('recent')
  async recentNotes(@Req() request: RequestWithUser): Promise<NoteEntity[]> {
    return this.noteService.recentNotes(request.user.id);
  }

  @Get(':id')
  async findOne(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<NoteEntity> {
    return this.noteService.findOneForUser(id, request.user.id);
  }


  @Patch(':id')
  async update(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() body: UpdateDto,
  ): Promise<NoteEntity> {
    return this.noteService.update(id, body, request.user.id);
  }

  @Delete(':id')
  async delete(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    this.noteService.delete(id, request.user.id);
  }
}
