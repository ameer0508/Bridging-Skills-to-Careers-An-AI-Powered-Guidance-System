import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/** One question as it was presented in an attempt. */
export interface IAttemptQuestion {
  questionId: string;
  /** Order the options were shown in: presented position -> index in the question bank. */
  optionOrder: number[];
}

export type AssessmentAttemptStatus = 'in_progress' | 'submitted' | 'expired';

/** One sitting of a skill check. Kept as the user's history whatever the result. */
export interface IAssessmentAttempt extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  skillName: string;
  questions: IAttemptQuestion[];
  status: AssessmentAttemptStatus;
  startedAt: Date;
  expiresAt: Date;
  submittedAt?: Date;
  /** Chosen presented position per question; null when left unanswered. */
  answers?: Array<number | null>;
  correctCount?: number;
  passed?: boolean;
  /** Correct answers needed to pass, fixed when the attempt started. */
  passMark: number;
  /** Version of the question bank the attempt was drawn from. */
  bankVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttemptQuestionSchema = new Schema<IAttemptQuestion>(
  {
    questionId: { type: String, required: true },
    optionOrder: { type: [Number], required: true }
  },
  { _id: false }
);

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skillName: { type: String, required: true },
    questions: { type: [AttemptQuestionSchema], default: [] },
    status: { type: String, enum: ['in_progress', 'submitted', 'expired'], default: 'in_progress' },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    submittedAt: { type: Date },
    answers: { type: [Schema.Types.Mixed], default: undefined },
    correctCount: { type: Number },
    passed: { type: Boolean },
    passMark: { type: Number, required: true },
    bankVersion: { type: String, required: true }
  },
  { timestamps: true }
);

AssessmentAttemptSchema.index({ userId: 1, skillName: 1, startedAt: -1 });

export const AssessmentAttempt: Model<IAssessmentAttempt> =
  (mongoose.models.AssessmentAttempt as Model<IAssessmentAttempt>) ||
  mongoose.model<IAssessmentAttempt>('AssessmentAttempt', AssessmentAttemptSchema);
export default AssessmentAttempt;
