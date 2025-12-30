import { SessionStatus } from '../schemas/conversation-session.schema';

/**
 * Check if a session can be transitioned to a new status
 * Basic validation - can be extended later
 */
export function canTransitionStatus(
  currentStatus: SessionStatus,
  newStatus: SessionStatus,
): boolean {
  // Once completed or failed, can't change
  if (currentStatus === SessionStatus.COMPLETED || currentStatus === SessionStatus.FAILED) {
    return false;
  }

  // Can always transition to completed or failed
  if (newStatus === SessionStatus.COMPLETED || newStatus === SessionStatus.FAILED) {
    return true;
  }

  // Other transitions are allowed for now
  return true;
}

/**
 * Validate session ID format (basic check)
 * In production, might want more strict validation
 */
export function isValidSessionId(sessionId: string): boolean {
  if (!sessionId || sessionId.trim().length === 0) {
    return false;
  }
  // Basic length check - adjust based on your requirements
  return sessionId.length <= 255;
}

