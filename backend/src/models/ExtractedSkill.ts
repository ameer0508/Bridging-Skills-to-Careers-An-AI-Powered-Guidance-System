import mongoose, { Schema, Document } from 'mongoose';

export interface IExtractedSkill extends Document {
  resumeId?: string;
  userId?: string;
  name: string;
  category?: string;
  confidence?: number;
  context?: string;
}

const ExtractedSkillSchema = new Schema<IExtractedSkill>(
  {
    resumeId: { type: String },
    userId: { type: String },
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    confidence: { type: Number, default: 0.9 },
    context: { type: String }
  },
  { timestamps: true }
);

export const ExtractedSkill = mongoose.models.ExtractedSkill || mongoose.model<IExtractedSkill>('ExtractedSkill', ExtractedSkillSchema);
export default ExtractedSkill;
