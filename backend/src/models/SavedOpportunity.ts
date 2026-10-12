import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn'
];

/**
 * Where an event's date came from. 'recorded_at_change' (and older entries without the field) is
 * the moment the user changed the status in SkillBridge; 'user_stated' is a date the user entered
 * or corrected, such as the day an interview actually took place.
 */
export type EventDateSource = 'recorded_at_change' | 'user_stated';

export interface IStatusHistoryEntry {
  /** Stable id for corrections; entries saved before ids existed receive one on first read. */
  _id?: Types.ObjectId;
  status: ApplicationStatus;
  /** When the event happened. Analytics (C6) read this date. */
  changedAt: Date;
  note?: string;
  /** When the user entered it in SkillBridge; absent on entries older than this field. */
  recordedAt?: Date;
  dateSource?: EventDateSource;
  /** Last time the user corrected this event; null when never corrected. */
  editedAt?: Date | null;
}

export interface ISavedOpportunity extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  provider: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  applicationUrl: string;
  postedAt?: string;
  // Null when the posting listed no skills, so no honest score could be computed
  skillbridgeMatchScore: number | null;
  matchedSkills: string[];
  missingSkills: string[];
  description: string;
  status: ApplicationStatus;
  notes: string;
  statusHistory: IStatusHistoryEntry[];
  appliedAt?: Date;
  /** When the user wants to be reminded to follow up; null when no reminder is set. */
  reminderAt?: Date | null;
  reminderNote?: string;
  /** True when this was saved from a built-in demo listing rather than a live posting. */
  isSample?: boolean;
  remote?: boolean;
  employmentType?: string;
  matchExplanation?: string;
  savedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: { type: String, enum: APPLICATION_STATUSES, required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
    recordedAt: { type: Date },
    dateSource: { type: String, enum: ['recorded_at_change', 'user_stated'] },
    editedAt: { type: Date, default: null }
  },
  // Each event has an id so a single entry can be corrected or removed
  { _id: true }
);

const SavedOpportunitySchema = new Schema<ISavedOpportunity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, required: true },
    externalId: { type: String, required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: '' },
    salary: { type: String, default: '' },
    applicationUrl: { type: String, default: '' },
    postedAt: { type: String },
    skillbridgeMatchScore: { type: Number, default: null },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    description: { type: String, default: '' },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'saved' },
    notes: { type: String, default: '' },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    appliedAt: { type: Date },
    reminderAt: { type: Date, default: null },
    reminderNote: { type: String, default: '' },
    isSample: { type: Boolean, default: false },
    remote: { type: Boolean },
    employmentType: { type: String, default: '' },
    matchExplanation: { type: String, default: '' },
    savedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

SavedOpportunitySchema.index({ userId: 1, provider: 1, externalId: 1 }, { unique: true });

export const SavedOpportunity: Model<ISavedOpportunity> =
  (mongoose.models.SavedOpportunity as Model<ISavedOpportunity>) ||
  mongoose.model<ISavedOpportunity>('SavedOpportunity', SavedOpportunitySchema);
export default SavedOpportunity;
