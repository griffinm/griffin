import { IsOptional, IsString } from 'class-validator';

export class NewConversationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  initialMessage?: string;
}

