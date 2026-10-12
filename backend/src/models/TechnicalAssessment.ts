import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * One technical assessment attempt (D4). Only task ids are stored; the task text and answer keys
 * live in the curated bank (backend/src/seed/technicalAssessmentBank.ts). No code is stored or run.
 */
export interface IAssessmentItem {
  taskId: string;
  kind: string;
  skill: string;
  /** The user's answer: an option index or line number as a number, or short text. */
  response?: string | number;
  correct?: boolean;
  answeredAt?: Date;
}

export interface ITechnicalAssessment extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  status: 'active' | 'completed';
  filters: { skills: string[]; kinds: string[] };
  items: IAssessmentItem[];
  score?: { answered: number; correct: number; total: number; percent: number };
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IAssessmentItem>(
  {
    taskId: { type: String, required: true },
    kind: { type: String, required: true },
    skill: { type: String, required: true },
    response: { type: Schema.Types.Mixed },
    correct: { type: Boolean },
    answeredAt: { type: Date },
  },
  { _id: false }
);

const TechnicalAssessmentSchema = new Schema<ITechnicalAssessment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    filters: {
      skills: { type: [String], default: [] },
      kinds: { type: [String], default: [] },
    },
    items: { type: [ItemSchema], default: [] },
    score: {
      type: new Schema({ answered: Number, correct: Number, total: Number, percent: Number }, { _id: false }),
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

TechnicalAssessmentSchema.index({ userId: 1, createdAt: -1 });

export const TechnicalAssessment: Model<ITechnicalAssessment> =
  (mongoose.models.TechnicalAssessment as Model<ITechnicalAssessment>) ||
  mongoose.model<ITechnicalAssessment>('TechnicalAssessment', TechnicalAssessmentSchema);
export default TechnicalAssessment;
