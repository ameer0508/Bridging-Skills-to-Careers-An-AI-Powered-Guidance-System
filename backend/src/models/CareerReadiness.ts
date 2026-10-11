import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IDimensionScore {
  name: string;
  score: number;
  weight: number;
}

export interface ICareerReadiness extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  careerId: Types.ObjectId;
  overallScore: number;
  readinessTier: string;
  interpretation: string;
  dimensions: IDimensionScore[];
  createdAt: Date;
  updatedAt: Date;
}

const DimensionScoreSchema = new Schema<IDimensionScore>(
  {
    name: { type: String, required: true },
    score: { type: Number, required: true },
    weight: { type: Number, required: true }
  },
  { _id: false }
);

const CareerReadinessSchema = new Schema<ICareerReadiness>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    readinessTier: { type: String, default: 'Early' },
    interpretation: { type: String, default: '' },
    dimensions: { type: [DimensionScoreSchema], default: [] }
  },
  { timestamps: true }
);

export const CareerReadiness: Model<ICareerReadiness> =
  (mongoose.models.CareerReadiness as Model<ICareerReadiness>) ||
  mongoose.model<ICareerReadiness>('CareerReadiness', CareerReadinessSchema);
export default CareerReadiness;
