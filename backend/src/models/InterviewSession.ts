import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionItem {
  questionId?: string;
  question: string;
  category?: string;
  difficulty?: string;
  expectedConcepts?: string[];
  candidateResponse?: string;
  evaluation?: {
    score?: number;
    starFormatted?: boolean;
    strengths?: string[];
    improvements?: string[];
    missingConcepts?: string[];
    feedback?: string;
    evaluatedAt?: Date;
  };
}

export interface IInterviewSession extends Document {
  userId: any;
  targetCareerId?: any;
  targetCareerTitle?: string;
  targetRole?: string;
  mode?: string;
  status?: string;
  questionCount?: number;
  currentQuestionIndex?: number;
  questions: IQuestionItem[];
  strengths?: string[];
  weaknesses?: string[];
  overallScore?: number;
  dimensionScores?: Record<string, number>;
  preparationRecommendations?: string[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    targetCareerId: { type: Schema.Types.Mixed },
    targetCareerTitle: { type: String, default: 'General Software Engineer' },
    targetRole: { type: String, default: 'General Software Engineer' },
    mode: { type: String, default: 'technical' },
    status: { type: String, default: 'active' },
    questionCount: { type: Number, default: 5 },
    currentQuestionIndex: { type: Number, default: 0 },
    questions: { type: Schema.Types.Mixed, default: [] },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    overallScore: { type: Number, default: 0 },
    dimensionScores: { type: Schema.Types.Mixed, default: {} },
    preparationRecommendations: { type: [String], default: [] },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export const InterviewSession = mongoose.models.InterviewSession || mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
export default InterviewSession;
