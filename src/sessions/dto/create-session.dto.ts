import { IsString, IsOptional, IsObject, IsEnum, MinLength } from 'class-validator';
import { SessionStatus } from '../schemas/conversation-session.schema';

export class CreateSessionDto {
  @IsString()
  @MinLength(1)
  sessionId: string;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsString()
  @MinLength(1)
  language: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

