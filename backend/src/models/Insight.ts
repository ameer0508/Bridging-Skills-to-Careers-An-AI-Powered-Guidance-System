import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IInsight extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  type: string;
  title: string;
  description: string;
  metricsReference: Record<string, unknown>;
  createdAt: Date;
}

const InsightSchema = new Schema<IInsight>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, default: 'trend' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    metricsReference: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const Insight: Model<IInsight> =
  (mongoose.models.Insight as Model<IInsight>) || mongoose.model<IInsight>('Insight', InsightSchema);
export default Insight;
