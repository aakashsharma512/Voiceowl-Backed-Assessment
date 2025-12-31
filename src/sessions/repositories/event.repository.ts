import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ConversationEvent,
  ConversationEventDocument,
} from '../schemas/conversation-event.schema';

@Injectable()
export class EventRepository {
  constructor(
    @InjectModel(ConversationEvent.name)
    private readonly eventModel: Model<ConversationEventDocument>,
  ) {}

  async findBySessionId(
    sessionId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ConversationEventDocument[]> {
    return this.eventModel
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async findById(sessionId: string, eventId: string): Promise<ConversationEventDocument | null> {
    return this.eventModel.findOne({ sessionId, eventId }).exec();
  }

  async create(
    sessionId: string,
    eventId: string,
    type: string,
    payload: Record<string, any>,
    timestamp: Date,
  ): Promise<ConversationEventDocument> {
    return this.eventModel
      .findOneAndUpdate(
        { sessionId, eventId },
        {
          $setOnInsert: {
            sessionId,
            eventId,
            type,
            payload,
            timestamp,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        },
      )
      .exec();
  }

  async countBySessionId(sessionId: string): Promise<number> {
    return this.eventModel.countDocuments({ sessionId }).exec();
  }
}

