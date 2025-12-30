import { SessionResponseDto } from './session-response.dto';
import { EventResponseDto } from './event-response.dto';

export class SessionWithEventsResponseDto {
  session: SessionResponseDto;
  events: EventResponseDto[];
  eventCount: number;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

