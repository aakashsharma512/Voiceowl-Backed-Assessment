export const DEFAULT_PAGINATION_LIMIT = 50;
export const MAX_PAGINATION_LIMIT = 100;
export const MIN_PAGINATION_LIMIT = 1;

export const DEFAULT_PORT = 3000;

export const SESSION_ID_MAX_LENGTH = 255;
export const EVENT_ID_MAX_LENGTH = 255;

export const ERROR_MESSAGES = {
  SESSION_NOT_FOUND: (id: string) => `Session with ID ${id} not found`,
  EVENT_NOT_FOUND: (id: string) => `Event with ID ${id} not found`,
  INVALID_PAGINATION_LIMIT: 'Limit must be between 1 and 100',
  INVALID_PAGINATION_OFFSET: 'Offset must be non-negative',
  INVALID_SESSION_ID: 'Session ID is required and cannot be empty',
  INVALID_EVENT_ID: 'Event ID is required and cannot be empty',
} as const;

export const SUCCESS_MESSAGES = {
  SESSION_CREATED: 'Session created successfully',
  SESSION_RETRIEVED: 'Session retrieved successfully',
  SESSION_COMPLETED: 'Session completed successfully',
  SESSION_ALREADY_COMPLETED: 'Session already completed',
  EVENT_CREATED: 'Event created successfully',
  EVENT_RETRIEVED: 'Event retrieved successfully (already exists)',
  SESSION_WITH_EVENTS_RETRIEVED: 'Session and events retrieved successfully',
} as const;

