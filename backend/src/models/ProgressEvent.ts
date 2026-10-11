import mongoose, { Schema, Document } from 'mongoose';

export enum EventType {
  SKILL_ADDED = 'skill_added',
  ROADMAP_PROGRESS = 'roadmap_progress',
  RECOMMENDATION_COMPLETED = 'recommendation_completed',
  RESUME_UPLOADED = 'resume_uploaded',
  RESUME_REPLACED = 'resume_replaced',
  RESUME_PARSED = 'resume_parsed',
  INTERVIEW_COMPLETED = 'interview_completed'
}

export interface IProgressEvent extends Document {
  userId: any;
  eventType: string;
  data?: Record<string, any>;
  timestamp?: Date;
}

const ProgressEventSchema = new Schema<IProgressEvent>(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    eventType: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ProgressEvent = mongoose.models.ProgressEvent || mongoose.model<IProgressEvent>('ProgressEvent', ProgressEventSchema);
export default ProgressEvent;
