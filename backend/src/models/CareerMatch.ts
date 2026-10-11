import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type RequirementStatus = 'applied' | 'listed' | 'inferred' | 'missing';

/** How one career requirement contributed to the match score. */
export interface IRequirementBreakdown {
  skillName: string;
  importance: 'required' | 'preferred' | 'supporting';
  weight: number;
  // applied: used in a role/project/certification; listed: only mentioned;
  // inferred: demonstrated through a related skill; missing: no evidence
  status: RequirementStatus;
  evidenceScore: number;
  matchedVia?: string;
  pointsEarned: number;
  pointsPossible: number;
}

export interface ICareerMatch extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  careerId: Types.ObjectId;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  confidence: number;
  breakdown: IRequirementBreakdown[];
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const RequirementBreakdownSchema = new Schema<IRequirementBreakdown>(
  {
    skillName: { type: String, required: true },
    importance: { type: String, required: true },
    weight: { type: Number, required: true },
    status: { type: String, enum: ['applied', 'listed', 'inferred', 'missing'], required: true },
    evidenceScore: { type: Number, default: 0 },
    matchedVia: { type: String },
    pointsEarned: { type: Number, default: 0 },
    pointsPossible: { type: Number, default: 0 }
  },
  { _id: false }
);

const CareerMatchSchema = new Schema<ICareerMatch>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    matchingSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    confidence: { type: Number, default: 0 },
    breakdown: { type: [RequirementBreakdownSchema], default: [] },
    summary: { type: String, default: '' }
  },
  { timestamps: true }
);

CareerMatchSchema.index({ userId: 1, matchScore: -1 });

export const CareerMatch: Model<ICareerMatch> =
  (mongoose.models.CareerMatch as Model<ICareerMatch>) ||
  mongoose.model<ICareerMatch>('CareerMatch', CareerMatchSchema);
export default CareerMatch;
