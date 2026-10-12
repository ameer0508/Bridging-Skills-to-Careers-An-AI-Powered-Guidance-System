import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/** What happened that may have changed a user's career intelligence. */
export type RecalculationTrigger =
  | 'resume_processed'
  | 'resume_deleted'
  | 'skill_evidence_changed'
  | 'target_role_changed'
  | 'roadmap_progress'
  | 'interview_completed'
  | 'taxonomy_changed'
  | 'manual';

/** The derived modules a recalculation can refresh, in dependency order. */
export type IntelligenceModule = 'matches' | 'readiness' | 'recommendations' | 'snapshot';

/** Headline figures captured before and after a run, so its effect is measurable. */
export interface IIntelligenceFigures {
  skillCount: number;
  topCareerTitle: string | null;
  topMatchScore: number | null;
  readinessScore: number | null;
  activeRecommendations: number;
}

export interface IRecalculationRun extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  trigger: RecalculationTrigger;
  /** What the trigger refers to, e.g. a resume id. */
  triggerRef?: string;
  /** Identifies the input state; a repeat with the same fingerprint is skipped. */
  fingerprint: string;
  status: 'completed' | 'skipped_duplicate' | 'failed';
  modulesRecomputed: IntelligenceModule[];
  modulesSkipped: IntelligenceModule[];
  before: IIntelligenceFigures;
  after: IIntelligenceFigures;
  scoringVersion: string;
  taxonomyVersion: string;
  durationMs: number;
  error?: string;
  createdAt: Date;
}

const FiguresSchema = new Schema<IIntelligenceFigures>(
  {
    skillCount: { type: Number, default: 0 },
    topCareerTitle: { type: String, default: null },
    topMatchScore: { type: Number, default: null },
    readinessScore: { type: Number, default: null },
    activeRecommendations: { type: Number, default: 0 }
  },
  { _id: false }
);

const RecalculationRunSchema = new Schema<IRecalculationRun>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trigger: { type: String, required: true },
    triggerRef: { type: String },
    fingerprint: { type: String, required: true },
    status: { type: String, enum: ['completed', 'skipped_duplicate', 'failed'], required: true },
    modulesRecomputed: { type: [String], default: [] },
    modulesSkipped: { type: [String], default: [] },
    before: { type: FiguresSchema, required: true },
    after: { type: FiguresSchema, required: true },
    scoringVersion: { type: String, required: true },
    taxonomyVersion: { type: String, required: true },
    durationMs: { type: Number, default: 0 },
    error: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

RecalculationRunSchema.index({ userId: 1, createdAt: -1 });

export const RecalculationRun: Model<IRecalculationRun> =
  (mongoose.models.RecalculationRun as Model<IRecalculationRun>) ||
  mongoose.model<IRecalculationRun>('RecalculationRun', RecalculationRunSchema);
export default RecalculationRun;
