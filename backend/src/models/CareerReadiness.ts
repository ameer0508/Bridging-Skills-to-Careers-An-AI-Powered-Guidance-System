import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IDimensionScore {
  name: string;
  score: number;
  weight: number;
}

/**
 * What the readiness score rests on: the share of the credited skill evidence by how far it was
 * checked. Shares are whole percentages that add up to 100, or null when nothing is credited.
 */
export interface IEvidenceBasis {
  /** Shown in a SkillBridge skill check. */
  assessed: number | null;
  /** Portfolio work recorded by the user; not checked. */
  selfReported: number | null;
  /** Written in the resume; not checked. */
  stated: number | null;
  /** Credited from a related skill, not from the skill itself. */
  inferred: number | null;
  requirementsTotal: number;
  requirementsCovered: number;
  /** Covered requirements whose skill was also verified by a skill check. */
  requirementsAssessed: number;
  requiredMissing: number;
}

export interface ICareerReadiness extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  careerId: Types.ObjectId;
  overallScore: number;
  readinessTier: string;
  interpretation: string;
  dimensions: IDimensionScore[];
  evidenceBasis?: IEvidenceBasis;
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
    dimensions: { type: [DimensionScoreSchema], default: [] },
    evidenceBasis: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const CareerReadiness: Model<ICareerReadiness> =
  (mongoose.models.CareerReadiness as Model<ICareerReadiness>) ||
  mongoose.model<ICareerReadiness>('CareerReadiness', CareerReadinessSchema);
export default CareerReadiness;
