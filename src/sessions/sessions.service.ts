import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { SessionRepository } from './repositories/session.repository';
import { EventRepository } from './repositories/event.repository';
import { CreateSessionDto } from './dto/create-session.dto';
import { AddEventDto } from './dto/add-event.dto';
import { QueryParamsDto } from './dto/query-params.dto';
import {
  ConversationSession,
  SessionStatus,
} from './schemas/conversation-session.schema';
import { ConversationEvent } from './schemas/conversation-event.schema';
import { ApiResponse, PaginatedResponse } from '../common/dto/api-response.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { SessionWithEventsResponseDto } from './dto/session-with-events-response.dto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly eventRepository: EventRepository,
  ) {}

  async createOrUpsertSession(
    createSessionDto: CreateSessionDto,
  ): Promise<ApiResponse<SessionResponseDto>> {
    const { sessionId, language, status, metadata } = createSessionDto;

    // First check if we already have this session
    const existing = await this.sessionRepository.findById(sessionId);
    if (existing) {
      this.logger.debug(`Session ${sessionId} already exists, returning existing`);
      const sessionData = existing.toObject();
      return new ApiResponse<SessionResponseDto>(
        this.mapToSessionResponse(sessionData),
        'Session retrieved successfully',
        true,
        HttpStatus.OK,
      );
    }

    // Create new session - using upsert to handle race conditions
    // If two requests come in at the same time, only one will create
    const newSession = await this.sessionRepository.createOrUpdate(sessionId, {
      language,
      status: status || SessionStatus.INITIATED,
      metadata: metadata || {},
    });

    this.logger.log(`Created new session: ${sessionId}`);
    const sessionData = newSession.toObject();
    return new ApiResponse<SessionResponseDto>(
      this.mapToSessionResponse(sessionData),
      'Session created successfully',
      true,
      HttpStatus.OK,
    );
  }

  async addEventToSession(
    sessionId: string,
    addEventDto: AddEventDto,
  ): Promise<ApiResponse<EventResponseDto>> {
    // Make sure the session actually exists first
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      this.logger.warn(`Attempted to add event to non-existent session: ${sessionId}`);
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const { eventId, type, payload, timestamp } = addEventDto;

    // Check if we've seen this event before (idempotency)
    const existing = await this.eventRepository.findById(sessionId, eventId);
    if (existing) {
      this.logger.debug(`Event ${eventId} already exists for session ${sessionId}`);
      const eventData = existing.toObject();
      return new ApiResponse<EventResponseDto>(
        this.mapToEventResponse(eventData),
        'Event retrieved successfully (already exists)',
        true,
        HttpStatus.OK,
      );
    }

    // Use the provided timestamp or default to now
    const eventTimestamp = timestamp || new Date();

    // Create the event - upsert handles duplicates at DB level too
    const event = await this.eventRepository.create(
      sessionId,
      eventId,
      type,
      payload,
      eventTimestamp,
    );

    this.logger.log(`Added event ${eventId} to session ${sessionId}`);
    const eventData = event.toObject();
    return new ApiResponse<EventResponseDto>(
      this.mapToEventResponse(eventData),
      'Event created successfully',
      true,
      HttpStatus.CREATED,
    );
  }

  async getSessionWithEvents(
    sessionId: string,
    queryParams: QueryParamsDto,
  ): Promise<ApiResponse<SessionWithEventsResponseDto>> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Default pagination values
    const limit = queryParams.limit ?? 50;
    const offset = queryParams.offset ?? 0;

    // Sanity check on pagination params
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }
    if (offset < 0) {
      throw new BadRequestException('Offset must be non-negative');
    }

    // Fetch events and total count in parallel for better performance
    const [events, total] = await Promise.all([
      this.eventRepository.findBySessionId(sessionId, limit, offset),
      this.eventRepository.countBySessionId(sessionId),
    ]);

    const response: SessionWithEventsResponseDto = {
      session: this.mapToSessionResponse(session.toObject()),
      events: events.map((e) => this.mapToEventResponse(e.toObject())),
      eventCount: events.length,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };

    return new ApiResponse<SessionWithEventsResponseDto>(
      response,
      'Session and events retrieved successfully',
      true,
      HttpStatus.OK,
    );
  }

  async completeSession(sessionId: string): Promise<ApiResponse<SessionResponseDto>> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    // Already completed? Just return it (idempotent)
    if (session.status === SessionStatus.COMPLETED) {
      this.logger.debug(`Session ${sessionId} already completed`);
      const sessionData = session.toObject();
      return new ApiResponse<SessionResponseDto>(
        this.mapToSessionResponse(sessionData),
        'Session already completed',
        true,
        HttpStatus.OK,
      );
    }

    // Mark as completed with current timestamp
    const endedAt = new Date();
    const updated = await this.sessionRepository.updateStatus(
      sessionId,
      SessionStatus.COMPLETED,
      endedAt,
    );

    if (!updated) {
      // This shouldn't happen but just in case
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    this.logger.log(`Completed session: ${sessionId}`);
    const sessionData = updated.toObject();
    return new ApiResponse<SessionResponseDto>(
      this.mapToSessionResponse(sessionData),
      'Session completed successfully',
      true,
      HttpStatus.OK,
    );
  }

  // Helper methods to map database models to response DTOs
  private mapToSessionResponse(session: any): SessionResponseDto {
    return {
      sessionId: session.sessionId,
      status: session.status,
      language: session.language,
      startedAt: this.formatDate(session.startedAt),
      endedAt: session.endedAt ? this.formatDate(session.endedAt) : null,
      metadata: session.metadata || {},
    };
  }

  private mapToEventResponse(event: any): EventResponseDto {
    return {
      eventId: event.eventId,
      sessionId: event.sessionId,
      type: event.type,
      payload: event.payload || {},
      timestamp: this.formatDate(event.timestamp),
    };
  }

  private formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString();
    return String(date);
  }
}

