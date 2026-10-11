import mongoose, { Schema, Document } from 'mongoose';

export interface IReadinessHistory extends Document {
  userId: string;
  targetRole: string;
  score: number;
  timestamp: Date;
}

const ReadinessHistorySchema = new Schema<IReadinessHistory>(
  {
    userId: { type: String, required: true, index: true },
    targetRole: { type: String, required: true },
    score: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ReadinessHistory = mongoose.models.ReadinessHistory || mongoose.model<IReadinessHistory>('ReadinessHistory', ReadinessHistorySchema);
export default ReadinessHistory;
