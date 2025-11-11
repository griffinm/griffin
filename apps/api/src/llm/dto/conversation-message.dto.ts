import { IsNotEmpty, IsString } from 'class-validator';

export class ConversationMessageDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}

