import mongoose, { Schema, Document } from 'mongoose';

export interface ICareerMatch extends Document {
  userId: string;
  targetRole: string;
  matchScore: number;
  breakdown?: Record<string, any>;
  matchedSkills?: string[];
  missingSkills?: string[];
  calculatedAt?: Date;
}

const CareerMatchSchema = new Schema<ICareerMatch>(
  {
    userId: { type: String, required: true, index: true },
    targetRole: { type: String, required: true },
    matchScore: { type: Number, required: true },
    breakdown: { type: Schema.Types.Mixed, default: {} },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    calculatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const CareerMatch = mongoose.models.CareerMatch || mongoose.model<ICareerMatch>('CareerMatch', CareerMatchSchema);
export default CareerMatch;
