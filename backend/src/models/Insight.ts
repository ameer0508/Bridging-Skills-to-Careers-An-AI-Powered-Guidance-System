import mongoose, { Schema, Document } from 'mongoose';

export interface IInsight extends Document {
  userId: string;
  type?: string;
  title: string;
  description?: string;
  impact?: string;
  createdAt?: Date;
}

const InsightSchema = new Schema<IInsight>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, default: 'career_growth' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    impact: { type: String, default: 'medium' }
  },
  { timestamps: true }
);

export const Insight = mongoose.models.Insight || mongoose.model<IInsight>('Insight', InsightSchema);
export default Insight;
