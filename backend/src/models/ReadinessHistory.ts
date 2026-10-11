import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReadinessHistory extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  careerId: Types.ObjectId;
  overallScore: number;
  createdAt: Date;
}

const ReadinessHistorySchema = new Schema<IReadinessHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
    overallScore: { type: Number, required: true }
  },
  { timestamps: true }
);

export const ReadinessHistory: Model<IReadinessHistory> =
  (mongoose.models.ReadinessHistory as Model<IReadinessHistory>) ||
  mongoose.model<IReadinessHistory>('ReadinessHistory', ReadinessHistorySchema);
export default ReadinessHistory;
