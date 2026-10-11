import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export const EventType = {
  SKILL_ADDED: 'skill_added',
  ROADMAP_PROGRESS: 'roadmap_progress',
  ROADMAP_ITEM_COMPLETED: 'roadmap_item_completed',
  RECOMMENDATION_COMPLETED: 'recommendation_completed',
  RESUME_UPLOADED: 'resume_uploaded',
  RESUME_REPLACED: 'resume_replaced',
  RESUME_PARSED: 'resume_parsed',
  INTERVIEW_COMPLETED: 'interview_completed',
  OPPORTUNITY_SAVED: 'opportunity_saved',
  APPLICATION_STATUS_CHANGED: 'application_status_changed',
  WORKFLOW_EXECUTED: 'workflow_executed'
} as const;

// Value and type intentionally share a name so callers can use both `EventType.X` and `: EventType`
// eslint-disable-next-line no-redeclare
export type EventType = (typeof EventType)[keyof typeof EventType];

export interface IProgressEvent extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  eventType: EventType;
  details: Record<string, unknown>;
  entityId?: Types.ObjectId;
  createdAt: Date;
}

const ProgressEventSchema = new Schema<IProgressEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventType: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    entityId: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

ProgressEventSchema.index({ userId: 1, createdAt: -1 });

export const ProgressEvent: Model<IProgressEvent> =
  (mongoose.models.ProgressEvent as Model<IProgressEvent>) ||
  mongoose.model<IProgressEvent>('ProgressEvent', ProgressEventSchema);
export default ProgressEvent;
