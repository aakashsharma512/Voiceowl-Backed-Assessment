import { SessionStatus } from '../schemas/conversation-session.schema';

export function canTransitionStatus(
  currentStatus: SessionStatus,
  newStatus: SessionStatus,
): boolean {
  if (currentStatus === SessionStatus.COMPLETED || currentStatus === SessionStatus.FAILED) {
    return false;
  }

  if (newStatus === SessionStatus.COMPLETED || newStatus === SessionStatus.FAILED) {
    return true;
  }

  return true;
}

export function isValidSessionId(sessionId: string): boolean {
  if (!sessionId || sessionId.trim().length === 0) {
    return false;
  }
  return sessionId.length <= 255;
}

