import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ConversationSession,
  ConversationSessionDocument,
  SessionStatus,
} from '../schemas/conversation-session.schema';

@Injectable()
export class SessionRepository {
  constructor(
    @InjectModel(ConversationSession.name)
    private readonly sessionModel: Model<ConversationSessionDocument>,
  ) {}

  async findById(sessionId: string): Promise<ConversationSessionDocument | null> {
    return this.sessionModel.findOne({ sessionId }).exec();
  }

  async createOrUpdate(
    sessionId: string,
    data: Partial<ConversationSession>,
  ): Promise<ConversationSessionDocument> {
    // Atomic upsert - handles concurrent requests
    // $setOnInsert only sets these on creation, not on update
    // This way if session exists, we don't overwrite it
    const now = new Date();
    return this.sessionModel
      .findOneAndUpdate(
        { sessionId },
        {
          $setOnInsert: {
            sessionId,
            startedAt: now,
            status: data.status || SessionStatus.INITIATED,
            language: data.language,
            metadata: data.metadata || {},
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

  async updateStatus(
    sessionId: string,
    status: SessionStatus,
    endedAt?: Date,
  ): Promise<ConversationSessionDocument | null> {
    const updateData: any = { status };
    if (endedAt !== undefined) {
      updateData.endedAt = endedAt;
    }

    return this.sessionModel
      .findOneAndUpdate(
        { sessionId },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }
}

