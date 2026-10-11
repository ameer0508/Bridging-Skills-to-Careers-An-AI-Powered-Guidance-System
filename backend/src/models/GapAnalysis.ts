import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IGapItem {
  skillName: string;
  impactScore: number;
  reason: string;
}

export interface IGapAnalysis extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  careerId: Types.ObjectId;
  criticalGaps: IGapItem[];
  weakAreas: IGapItem[];
  strengthAreas: IGapItem[];
  createdAt: Date;
  updatedAt: Date;
}

const GapItemSchema = new Schema<IGapItem>(
  {
    skillName: { type: String, required: true },
    impactScore: { type: Number, default: 0 },
    reason: { type: String, default: '' }
  },
  { _id: false }
);

const GapAnalysisSchema = new Schema<IGapAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
    criticalGaps: { type: [GapItemSchema], default: [] },
    weakAreas: { type: [GapItemSchema], default: [] },
    strengthAreas: { type: [GapItemSchema], default: [] }
  },
  { timestamps: true }
);

export const GapAnalysis: Model<IGapAnalysis> =
  (mongoose.models.GapAnalysis as Model<IGapAnalysis>) ||
  mongoose.model<IGapAnalysis>('GapAnalysis', GapAnalysisSchema);
export default GapAnalysis;
