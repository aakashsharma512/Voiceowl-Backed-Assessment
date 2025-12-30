import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationEventDocument = ConversationEvent & Document;

export enum EventType {
  USER_SPEECH = 'user_speech',
  BOT_SPEECH = 'bot_speech',
  SYSTEM = 'system',
}

@Schema({
  timestamps: false, // We manage timestamps manually
  collection: 'conversation_events',
})
export class ConversationEvent {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true, index: true })
  sessionId: string;

  @Prop({ required: true, enum: EventType })
  type: EventType;

  @Prop({ type: Object, required: true })
  payload: Record<string, any>;

  @Prop({ required: true, index: true })
  timestamp: Date;
}

export const ConversationEventSchema =
  SchemaFactory.createForClass(ConversationEvent);

// Unique compound index: eventId must be unique per session
// This prevents duplicate events and enables fast lookups
ConversationEventSchema.index({ sessionId: 1, eventId: 1 }, { unique: true });

// Compound index for pagination: filter by sessionId, sort by timestamp
// This makes the GET /sessions/:id query efficient
ConversationEventSchema.index({ sessionId: 1, timestamp: 1 });

