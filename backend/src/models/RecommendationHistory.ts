import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendationHistory extends Document {
  userId: string;
  recommendationId?: string;
  action: string;
  timestamp: Date;
}

const RecommendationHistorySchema = new Schema<IRecommendationHistory>(
  {
    userId: { type: String, required: true, index: true },
    recommendationId: { type: String },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const RecommendationHistory = mongoose.models.RecommendationHistory || mongoose.model<IRecommendationHistory>('RecommendationHistory', RecommendationHistorySchema);
export default RecommendationHistory;
