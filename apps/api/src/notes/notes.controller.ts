import { 
  Body,
  Controller, 
  Get, 
  Param, 
  Patch, 
  Req, 
  UseGuards,
  Delete,
  Post,
  Query,
 } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { NoteService } from './notes.service';
import { NoteEntity } from './dto/note.entity';
import { UpdateDto } from './dto/update.dto';
import type { RequestWithUser } from '@griffin/types';
import { TagService } from '../tag/tag.service';
import { TagEntity } from '../tag/entities/tag.entity';
import { AddTagToObjectDto } from '../tag/dto/add-tag-to-object.dto';

@Controller('notes')
@UseGuards(AuthGuard)
export class NotesController {
  constructor(
    private noteService: NoteService,
    private tagService: TagService,
  ) {}

  @Get()
  async findAll(@Req() request: RequestWithUser): Promise<NoteEntity[]> {
    return this.noteService.findAllForUser(request.user.id);
  }

  @Get('recent')
  async recentNotes(
    @Req() request: RequestWithUser,
    @Query('limit') limit?: string,
  ): Promise<NoteEntity[]> {
    const limitNumber = limit ? parseInt(limit, 10) : 5;
    return this.noteService.recentNotes(request.user.id, limitNumber);
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

  @Get(':id/tags')
  async getTags(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ): Promise<TagEntity[]> {
    return this.tagService.getTagsForObject(request.user.id, 'note', id);
  }

  @Post(':id/tags')
  async addTag(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Body() body: AddTagToObjectDto,
  ): Promise<TagEntity> {
    return this.tagService.addToObject(request.user.id, body.name, 'note', id);
  }

  @Delete(':id/tags/:tagId')
  async removeTag(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    return this.tagService.removeFromObject(request.user.id, tagId, 'note', id);
  }
}
