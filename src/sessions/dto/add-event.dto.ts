import { IsString, IsEnum, IsObject, IsDate, IsOptional, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../schemas/conversation-event.schema';

export class AddEventDto {
  @IsString()
  @MinLength(1)
  eventId: string;

  @IsEnum(EventType)
  type: EventType;

  @IsObject()
  payload: Record<string, any>;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  timestamp?: Date;
}

