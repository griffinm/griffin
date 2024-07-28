import { 
  Controller, 
  Get, 
  Param, 
  Req, 
  UseGuards,
 } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { NoteService } from './notes.service';
import { NoteEntity } from './dto/note.entity';

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
}
