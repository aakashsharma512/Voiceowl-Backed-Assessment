import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationEventDocument = ConversationEvent & Document;

export enum EventType {
  USER_SPEECH = 'user_speech',
  BOT_SPEECH = 'bot_speech',
  SYSTEM = 'system',
}

@Schema({
  timestamps: false,
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

ConversationEventSchema.index({ sessionId: 1, eventId: 1 }, { unique: true });
ConversationEventSchema.index({ sessionId: 1, timestamp: 1 });

