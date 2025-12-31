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
import {
  DEFAULT_PAGINATION_LIMIT,
  MAX_PAGINATION_LIMIT,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../common/constants/app.constants';
import { formatDate } from '../common/utils/date.utils';
import { sanitizeMetadata } from '../common/utils/validation.utils';

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

    const existing = await this.sessionRepository.findById(sessionId);
    if (existing) {
      this.logger.debug(`Session ${sessionId} already exists, returning existing`);
      const sessionData = existing.toObject();
      return new ApiResponse<SessionResponseDto>(
        this.mapToSessionResponse(sessionData),
        SUCCESS_MESSAGES.SESSION_RETRIEVED,
        true,
        HttpStatus.OK,
      );
    }

    const newSession = await this.sessionRepository.createOrUpdate(sessionId, {
      language,
      status: status || SessionStatus.INITIATED,
      metadata: sanitizeMetadata(metadata),
    });

    this.logger.log(`Created new session: ${sessionId}`);
    const sessionData = newSession.toObject();
    return new ApiResponse<SessionResponseDto>(
      this.mapToSessionResponse(sessionData),
      SUCCESS_MESSAGES.SESSION_CREATED,
      true,
      HttpStatus.OK,
    );
  }

  async addEventToSession(
    sessionId: string,
    addEventDto: AddEventDto,
  ): Promise<ApiResponse<EventResponseDto>> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      this.logger.warn(`Attempted to add event to non-existent session: ${sessionId}`);
      throw new NotFoundException(ERROR_MESSAGES.SESSION_NOT_FOUND(sessionId));
    }

    const { eventId, type, payload, timestamp } = addEventDto;

    const existing = await this.eventRepository.findById(sessionId, eventId);
    if (existing) {
      this.logger.debug(`Event ${eventId} already exists for session ${sessionId}`);
      const eventData = existing.toObject();
      return new ApiResponse<EventResponseDto>(
        this.mapToEventResponse(eventData),
        SUCCESS_MESSAGES.EVENT_RETRIEVED,
        true,
        HttpStatus.OK,
      );
    }

    const eventTimestamp = timestamp || new Date();
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
      SUCCESS_MESSAGES.EVENT_CREATED,
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
      throw new NotFoundException(ERROR_MESSAGES.SESSION_NOT_FOUND(sessionId));
    }

    const limit = queryParams.limit ?? DEFAULT_PAGINATION_LIMIT;
    const offset = queryParams.offset ?? 0;

    if (limit < MIN_PAGINATION_LIMIT || limit > MAX_PAGINATION_LIMIT) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_PAGINATION_LIMIT);
    }
    if (offset < 0) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_PAGINATION_OFFSET);
    }

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
      SUCCESS_MESSAGES.SESSION_WITH_EVENTS_RETRIEVED,
      true,
      HttpStatus.OK,
    );
  }

  async completeSession(sessionId: string): Promise<ApiResponse<SessionResponseDto>> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException(ERROR_MESSAGES.SESSION_NOT_FOUND(sessionId));
    }

    if (session.status === SessionStatus.COMPLETED) {
      this.logger.debug(`Session ${sessionId} already completed`);
      const sessionData = session.toObject();
      return new ApiResponse<SessionResponseDto>(
        this.mapToSessionResponse(sessionData),
        SUCCESS_MESSAGES.SESSION_ALREADY_COMPLETED,
        true,
        HttpStatus.OK,
      );
    }

    const endedAt = new Date();
    const updated = await this.sessionRepository.updateStatus(
      sessionId,
      SessionStatus.COMPLETED,
      endedAt,
    );

    if (!updated) {
      throw new NotFoundException(ERROR_MESSAGES.SESSION_NOT_FOUND(sessionId));
    }

    this.logger.log(`Completed session: ${sessionId}`);
    const sessionData = updated.toObject();
    return new ApiResponse<SessionResponseDto>(
      this.mapToSessionResponse(sessionData),
      SUCCESS_MESSAGES.SESSION_COMPLETED,
      true,
      HttpStatus.OK,
    );
  }

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
    return formatDate(date);
  }
}

