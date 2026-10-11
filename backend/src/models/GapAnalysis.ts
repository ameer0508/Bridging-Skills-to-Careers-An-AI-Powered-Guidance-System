import mongoose, { Schema, Document } from 'mongoose';

export interface IGapItem {
  skillName: string;
  gapType?: string;
  importance?: string;
  currentLevel?: number;
  requiredLevel?: number;
  impactScore?: number;
  reason?: string;
}

export interface IGapAnalysis extends Document {
  userId: any;
  targetRole: string;
  missingSkills?: string[] | IGapItem[] | any[];
  weakSkills?: string[] | IGapItem[] | any[];
  priorityGaps?: string[] | IGapItem[] | any[];
  criticalGaps?: IGapItem[] | any[];
  gapPercentage?: number;
}

const GapAnalysisSchema = new Schema<IGapAnalysis>(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    targetRole: { type: String, required: true },
    missingSkills: { type: Schema.Types.Mixed, default: [] },
    weakSkills: { type: Schema.Types.Mixed, default: [] },
    priorityGaps: { type: Schema.Types.Mixed, default: [] },
    criticalGaps: { type: Schema.Types.Mixed, default: [] },
    gapPercentage: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const GapAnalysis = mongoose.models.GapAnalysis || mongoose.model<IGapAnalysis>('GapAnalysis', GapAnalysisSchema);
export default GapAnalysis;
