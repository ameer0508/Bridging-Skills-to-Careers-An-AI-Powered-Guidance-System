import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/** Rubric dimensions, each 0-100. technicalAccuracy is null when it could not be judged. */
export interface IEvaluationDimensions {
  relevance: number;
  completeness: number;
  specificity: number;
  structure: number;
  technicalAccuracy: number | null;
}

export interface IQuestionEvaluation {
  score: number;
  starFormatted: boolean;
  strengths: string[];
  improvements: string[];
  missingConcepts: string[];
  feedback: string;
  // Which evaluator produced this result, so the UI can label it honestly
  source?: 'ai' | 'heuristic';
  dimensions?: IEvaluationDimensions;
  /** Role rubric (D5) whose weights produced the score; absent on evaluations from before rubrics, which used 'general'. */
  rubricId?: string;
  rubricVersion?: number;
  evaluatedAt: Date;
}

/**
 * Who wrote a question: an AI provider, the built-in question bank used when AI is unavailable,
 * or the follow-up rules (D3) reacting to the previous answer.
 */
export type InterviewQuestionSource = 'ai' | 'question_bank' | 'follow_up';

/** Why a follow-up was asked (D3). */
export interface IFollowUpReason {
  type: 'missing_concept' | 'low_specificity' | 'weak_structure';
  concept?: string;
}

export interface IQuestionItem {
  questionId: string;
  question: string;
  category: string;
  difficulty: string;
  expectedConcepts: string[];
  source?: InterviewQuestionSource;
  /** The fact on record the question is based on, e.g. "Skill on your resume: React". */
  groundedIn?: string;
  candidateResponse?: string;
  evaluation?: IQuestionEvaluation;
  /** Set on follow-up questions (D3): the questionId they follow up. */
  followUpOf?: string;
  followUpReason?: IFollowUpReason;
}

export type InterviewStatus = 'active' | 'completed' | 'abandoned';

export interface IInterviewSession extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  targetCareerId?: Types.ObjectId;
  targetCareerTitle: string;
  mode: string;
  status: InterviewStatus;
  questionCount: number;
  currentQuestionIndex: number;
  questions: IQuestionItem[];
  /** Role rubric (D5) chosen at the start; absent on older sessions, which are scored with 'general'. */
  rubricId?: string;
  rubricVersion?: number;
  /** D3: ask a follow-up when an answer misses something. Off unless the user turns it on. */
  adaptiveFollowUps?: boolean;
  /** D3: follow-ups asked and answered; kept out of the overall score. */
  followUpSummary?: { asked: number; answered: number; recovered: number; averageScore: number | null };
  /** Where this session's questions came from. Absent on sessions created before this field existed. */
  questionSource?: InterviewQuestionSource;
  /** The job posting this session prepares for, when it was started from one. */
  opportunityContext?: { title?: string; company?: string };
  strengths: string[];
  weaknesses: string[];
  overallScore?: number;
  /** Averages of the rubric dimensions over answered questions; null where never judged. */
  dimensionScores?: Record<string, number | null>;
  answeredCount?: number;
  /** 'ai', 'heuristic' or 'mixed': which evaluator produced the scores in this session. */
  evaluationSource?: string;
  preparationRecommendations: string[];
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionEvaluationSchema = new Schema<IQuestionEvaluation>(
  {
    score: { type: Number, required: true, min: 0, max: 100 },
    starFormatted: { type: Boolean, default: false },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    missingConcepts: { type: [String], default: [] },
    feedback: { type: String, default: '' },
    source: { type: String, enum: ['ai', 'heuristic'], default: 'heuristic' },
    dimensions: { type: Schema.Types.Mixed },
    rubricId: { type: String },
    rubricVersion: { type: Number },
    evaluatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

// Questions are sub-documents so answers and evaluations written in place are
// tracked by Mongoose and actually persisted.
const QuestionItemSchema = new Schema<IQuestionItem>(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    category: { type: String, default: 'technical' },
    difficulty: { type: String, default: 'medium' },
    expectedConcepts: { type: [String], default: [] },
    source: { type: String, enum: ['ai', 'question_bank', 'follow_up'] },
    groundedIn: { type: String },
    followUpOf: { type: String },
    followUpReason: { type: new Schema({ type: { type: String }, concept: { type: String } }, { _id: false }) },
    candidateResponse: { type: String },
    evaluation: { type: QuestionEvaluationSchema }
  },
  { _id: false }
);

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetCareerId: { type: Schema.Types.ObjectId, ref: 'Career' },
    targetCareerTitle: { type: String, default: '' },
    mode: { type: String, default: 'technical' },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
    questionCount: { type: Number, default: 5 },
    currentQuestionIndex: { type: Number, default: 0 },
    questions: { type: [QuestionItemSchema], default: [] },
    questionSource: { type: String, enum: ['ai', 'question_bank'] },
    rubricId: { type: String },
    rubricVersion: { type: Number },
    adaptiveFollowUps: { type: Boolean, default: false },
    followUpSummary: { type: Schema.Types.Mixed },
    opportunityContext: {
      type: new Schema({ title: { type: String }, company: { type: String } }, { _id: false }),
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    overallScore: { type: Number },
    dimensionScores: { type: Schema.Types.Mixed },
    answeredCount: { type: Number, default: 0 },
    evaluationSource: { type: String },
    preparationRecommendations: { type: [String], default: [] },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

InterviewSessionSchema.index({ userId: 1, createdAt: -1 });

export const InterviewSession: Model<IInterviewSession> =
  (mongoose.models.InterviewSession as Model<IInterviewSession>) ||
  mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
export default InterviewSession;
