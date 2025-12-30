import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConversationSessionDocument = ConversationSession & Document;

export enum SessionStatus {
  INITIATED = 'initiated',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({
  timestamps: false, // We manage timestamps manually
  collection: 'conversation_sessions',
})
export class ConversationSession {
  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({
    required: true,
    enum: SessionStatus,
    default: SessionStatus.INITIATED,
    index: true,
  })
  status: SessionStatus;

  @Prop({ required: true })
  language: string;

  @Prop({ required: true, index: true })
  startedAt: Date;

  @Prop({ default: null, index: true })
  endedAt: Date | null;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ConversationSessionSchema =
  SchemaFactory.createForClass(ConversationSession);

// Indexes for common query patterns
// Compound index for filtering by sessionId and status
ConversationSessionSchema.index({ sessionId: 1, status: 1 });
// Index for sorting by start time (descending for recent first)
ConversationSessionSchema.index({ startedAt: -1 });

