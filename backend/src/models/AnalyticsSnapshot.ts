import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsSnapshot extends Document {
  userId: string;
  targetCareer?: string;
  matchScore?: number;
  readinessScore?: number;
  skillsCount?: number;
  gapCount?: number;
  recommendationsCount?: number;
  capturedAt?: Date;
}

const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(
  {
    userId: { type: String, required: true, index: true },
    targetCareer: { type: String, default: '' },
    matchScore: { type: Number, default: 0 },
    readinessScore: { type: Number, default: 0 },
    skillsCount: { type: Number, default: 0 },
    gapCount: { type: Number, default: 0 },
    recommendationsCount: { type: Number, default: 0 },
    capturedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const AnalyticsSnapshot = mongoose.models.AnalyticsSnapshot || mongoose.model<IAnalyticsSnapshot>('AnalyticsSnapshot', AnalyticsSnapshotSchema);
export default AnalyticsSnapshot;
