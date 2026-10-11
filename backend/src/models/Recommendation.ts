import mongoose, { Schema, Document } from 'mongoose';

export enum RecommendationStatus {
  RECOMMENDED = 'recommended',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DISMISSED = 'dismissed'
}

export enum PriorityLevel {
  HIGHEST = 'Highest',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface IRecommendation extends Document {
  userId: any;
  careerId?: any;
  category?: string;
  type?: string;
  title: string;
  description?: string;
  provider?: string;
  url?: string;
  skillName?: string;
  targetSkill?: string;
  status: string;
  score?: number;
  priority?: string;
  priorityScore?: number;
  reason?: string;
  impact?: number;
  difficulty?: string;
  estimatedTime?: string;
  dependencies?: string[];
  confidence?: number;
  actionLink?: string;
  actionType?: string;
}

const RecommendationSchema = new Schema<IRecommendation>(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    careerId: { type: Schema.Types.Mixed, ref: 'Career', index: true },
    category: { type: String, default: 'General' },
    type: { type: String, default: 'action' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    provider: { type: String, default: '' },
    url: { type: String, default: '' },
    skillName: { type: String, default: '' },
    targetSkill: { type: String, default: '' },
    status: { type: String, default: 'active' },
    score: { type: Number, default: 0.8 },
    priority: { type: String, default: 'Medium' },
    priorityScore: { type: Number, default: 50 },
    reason: { type: String, default: '' },
    impact: { type: Number, default: 20 },
    difficulty: { type: String, default: 'Intermediate' },
    estimatedTime: { type: String, default: '1-2 weeks' },
    dependencies: { type: [String], default: [] },
    confidence: { type: Number, default: 85 },
    actionLink: { type: String, default: '' },
    actionType: { type: String, default: '' }
  },
  { timestamps: true, strict: false }
);

export const Recommendation = mongoose.models.Recommendation || mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
export default Recommendation;

