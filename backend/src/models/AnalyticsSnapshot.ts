import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISnapshotMetrics {
  totalSkills: number;
  averageReadinessScore: number;
  totalGaps: number;
  completedRecommendations: number;
  completedRoadmapItems: number;
}

export interface IAnalyticsSnapshot extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  period: 'daily';
  date: Date;
  metrics: ISnapshotMetrics;
  createdAt: Date;
  updatedAt: Date;
}

const SnapshotMetricsSchema = new Schema<ISnapshotMetrics>(
  {
    totalSkills: { type: Number, default: 0 },
    averageReadinessScore: { type: Number, default: 0 },
    totalGaps: { type: Number, default: 0 },
    completedRecommendations: { type: Number, default: 0 },
    completedRoadmapItems: { type: Number, default: 0 }
  },
  { _id: false }
);

const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    period: { type: String, enum: ['daily'], default: 'daily' },
    date: { type: Date, required: true },
    metrics: { type: SnapshotMetricsSchema, default: () => ({}) }
  },
  { timestamps: true }
);

AnalyticsSnapshotSchema.index({ userId: 1, period: 1, date: 1 });

export const AnalyticsSnapshot: Model<IAnalyticsSnapshot> =
  (mongoose.models.AnalyticsSnapshot as Model<IAnalyticsSnapshot>) ||
  mongoose.model<IAnalyticsSnapshot>('AnalyticsSnapshot', AnalyticsSnapshotSchema);
export default AnalyticsSnapshot;
