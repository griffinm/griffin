import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConversationMessageDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  /** IDs of notes the user attached to this message; their content is added to the AI's context. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachedNoteIds?: string[];
}
