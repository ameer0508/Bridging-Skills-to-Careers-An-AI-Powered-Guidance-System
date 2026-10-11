import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IRecommendationHistory extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  recommendationId: Types.ObjectId;
  previousStatus: string;
  newStatus: string;
  createdAt: Date;
}

const RecommendationHistorySchema = new Schema<IRecommendationHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recommendationId: { type: Schema.Types.ObjectId, ref: 'Recommendation', required: true },
    previousStatus: { type: String, default: '' },
    newStatus: { type: String, required: true }
  },
  { timestamps: true }
);

export const RecommendationHistory: Model<IRecommendationHistory> =
  (mongoose.models.RecommendationHistory as Model<IRecommendationHistory>) ||
  mongoose.model<IRecommendationHistory>('RecommendationHistory', RecommendationHistorySchema);
export default RecommendationHistory;
