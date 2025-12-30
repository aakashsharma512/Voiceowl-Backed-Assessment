import { EventType } from '../schemas/conversation-event.schema';

export class EventResponseDto {
  eventId: string;
  sessionId: string;
  type: EventType;
  payload: Record<string, any>;
  timestamp: string;
}

