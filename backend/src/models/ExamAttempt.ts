import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * One practice attempt at an exam pilot (E2, E3). Exam practice is kept apart from career skill
 * evidence: nothing here changes skills, readiness or career scores.
 */
export type ExamResponse = number | number[] | null;

export interface IExamAttemptItem {
  questionId: string;
  sectionId: string;
  topicId: string;
  response?: ExamResponse;
  answeredAt?: Date;
  /** Set when the attempt is scored. */
  outcome?: 'correct' | 'wrong' | 'unanswered';
  marksAwarded?: number;
}

export interface IExamAttemptSection {
  sectionId: string;
  /** Sectional timing (SSC): when this section's timer started and ends. */
  startedAt?: Date | null;
  deadline?: Date | null;
  closedAt?: Date | null;
  timeLimitSec?: number | null;
}

export interface IExamAttempt extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  examId: string;
  syllabusVersion: string;
  mode: 'practice' | 'timed';
  status: 'active' | 'completed';
  selection: { sectionIds: string[]; topicIds: string[]; requested: number };
  items: IExamAttemptItem[];
  sections: IExamAttemptSection[];
  /** Whole-paper timing (GATE). */
  timeLimitSec: number | null;
  deadline: Date | null;
  timedOut: boolean;
  score?: { attempted: number; correct: number; wrong: number; unanswered: number; marks: number; maxMarks: number; accuracy: number | null };
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IExamAttemptItem>(
  {
    questionId: { type: String, required: true },
    sectionId: { type: String, required: true },
    topicId: { type: String, required: true },
    response: { type: Schema.Types.Mixed, default: null },
    answeredAt: { type: Date },
    outcome: { type: String, enum: ['correct', 'wrong', 'unanswered'] },
    marksAwarded: { type: Number },
  },
  { _id: false }
);

const SectionSchema = new Schema<IExamAttemptSection>(
  {
    sectionId: { type: String, required: true },
    startedAt: { type: Date, default: null },
    deadline: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    timeLimitSec: { type: Number, default: null },
  },
  { _id: false }
);

const ExamAttemptSchema = new Schema<IExamAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: String, required: true },
    syllabusVersion: { type: String, required: true },
    mode: { type: String, enum: ['practice', 'timed'], required: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    selection: { sectionIds: [String], topicIds: [String], requested: Number },
    items: { type: [ItemSchema], default: [] },
    sections: { type: [SectionSchema], default: [] },
    timeLimitSec: { type: Number, default: null },
    deadline: { type: Date, default: null },
    timedOut: { type: Boolean, default: false },
    score: { type: Schema.Types.Mixed },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

ExamAttemptSchema.index({ userId: 1, examId: 1, createdAt: -1 });

export const ExamAttempt: Model<IExamAttempt> =
  (mongoose.models.ExamAttempt as Model<IExamAttempt>) || mongoose.model<IExamAttempt>('ExamAttempt', ExamAttemptSchema);
export default ExamAttempt;
