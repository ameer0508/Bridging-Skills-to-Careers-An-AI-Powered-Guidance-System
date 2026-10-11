import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IQuestionEvaluation {
  score: number;
  starFormatted: boolean;
  strengths: string[];
  improvements: string[];
  missingConcepts: string[];
  feedback: string;
  // Which evaluator produced this result, so the UI can label it honestly
  source?: 'ai' | 'heuristic';
  evaluatedAt: Date;
}

export interface IQuestionItem {
  questionId: string;
  question: string;
  category: string;
  difficulty: string;
  expectedConcepts: string[];
  candidateResponse?: string;
  evaluation?: IQuestionEvaluation;
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
  strengths: string[];
  weaknesses: string[];
  overallScore?: number;
  dimensionScores?: Record<string, number>;
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
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    overallScore: { type: Number },
    dimensionScores: { type: Schema.Types.Mixed },
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
