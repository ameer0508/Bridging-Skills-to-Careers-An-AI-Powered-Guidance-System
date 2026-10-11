import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICareerMatch extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  careerId: Types.ObjectId;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

const CareerMatchSchema = new Schema<ICareerMatch>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    matchingSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    confidence: { type: Number, default: 0 }
  },
  { timestamps: true }
);

CareerMatchSchema.index({ userId: 1, matchScore: -1 });

export const CareerMatch: Model<ICareerMatch> =
  (mongoose.models.CareerMatch as Model<ICareerMatch>) ||
  mongoose.model<ICareerMatch>('CareerMatch', CareerMatchSchema);
export default CareerMatch;
