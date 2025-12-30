import { SessionStatus } from '../schemas/conversation-session.schema';

export class SessionResponseDto {
  sessionId: string;
  status: SessionStatus;
  language: string;
  startedAt: string;
  endedAt: string | null;
  metadata: Record<string, any>;
}

