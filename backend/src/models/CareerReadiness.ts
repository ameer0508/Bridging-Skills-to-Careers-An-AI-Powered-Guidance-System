import mongoose, { Schema, Document } from 'mongoose';

export interface IDimensionScore {
  dimension?: string;
  name?: string;
  score: number;
  weight?: number;
  details?: Record<string, any>;
}

export interface ICareerReadiness extends Document {
  userId: any;
  targetRole: string;
  overallScore: number;
  readinessScore?: number;
  dimensionScores?: IDimensionScore[] | Record<string, any>;
  calculatedAt?: Date;
}

const CareerReadinessSchema = new Schema<ICareerReadiness>(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    targetRole: { type: String, required: true },
    overallScore: { type: Number, required: true },
    readinessScore: { type: Number },
    dimensionScores: { type: Schema.Types.Mixed, default: [] },
    calculatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const CareerReadiness = mongoose.models.CareerReadiness || mongoose.model<ICareerReadiness>('CareerReadiness', CareerReadinessSchema);
export default CareerReadiness;
