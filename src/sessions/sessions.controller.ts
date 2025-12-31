import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { AddEventDto } from './dto/add-event.dto';
import { QueryParamsDto } from './dto/query-params.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async createOrUpsertSession(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.createOrUpsertSession(createSessionDto);
  }

  @Post(':sessionId/events')
  @HttpCode(HttpStatus.CREATED)
  async addEventToSession(
    @Param('sessionId') sessionId: string,
    @Body() addEventDto: AddEventDto,
  ) {
    return this.sessionsService.addEventToSession(sessionId, addEventDto);
  }

  @Get(':sessionId')
  async getSessionWithEvents(
    @Param('sessionId') sessionId: string,
    @Query() queryParams: QueryParamsDto,
  ) {
    return this.sessionsService.getSessionWithEvents(sessionId, queryParams);
  }

  @Post(':sessionId/complete')
  @HttpCode(HttpStatus.OK)
  async completeSession(@Param('sessionId') sessionId: string) {
    return this.sessionsService.completeSession(sessionId);
  }
}

