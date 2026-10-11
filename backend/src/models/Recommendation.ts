import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type RecommendationStatus =
  | 'active'
  | 'accepted'
  | 'dismissed'
  | 'completed'
  | 'saved_for_later';

export const RECOMMENDATION_STATUSES: RecommendationStatus[] = [
  'active',
  'accepted',
  'dismissed',
  'completed',
  'saved_for_later'
];

export type PriorityLevel = 'Highest' | 'High' | 'Medium' | 'Low';

export interface IRecommendation extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  careerId: Types.ObjectId;
  category: string;
  type?: string;
  title: string;
  description: string;
  status: RecommendationStatus;
  priority: PriorityLevel;
  priorityScore: number;
  reason: string;
  impact: number;
  difficulty: string;
  estimatedTime: string;
  dependencies: string[];
  confidence: number;
  actionLink?: string;
  actionType?: string;
  targetSkill: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true, index: true },
    category: { type: String, default: 'Learning Resources' },
    type: { type: String },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: RECOMMENDATION_STATUSES, default: 'active' },
    priority: { type: String, enum: ['Highest', 'High', 'Medium', 'Low'], default: 'Medium' },
    priorityScore: { type: Number, default: 50 },
    reason: { type: String, default: '' },
    impact: { type: Number, default: 0 },
    difficulty: { type: String, default: 'Intermediate' },
    estimatedTime: { type: String, default: '' },
    dependencies: { type: [String], default: [] },
    confidence: { type: Number, default: 0 },
    actionLink: { type: String, default: '' },
    actionType: { type: String, default: '' },
    targetSkill: { type: String, default: '' }
  },
  { timestamps: true }
);

RecommendationSchema.index({ userId: 1, status: 1, priorityScore: -1 });

export const Recommendation: Model<IRecommendation> =
  (mongoose.models.Recommendation as Model<IRecommendation>) ||
  mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
export default Recommendation;
