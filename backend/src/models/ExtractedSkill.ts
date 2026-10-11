import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IExtractedSkill extends Document<Types.ObjectId> {
  resumeId: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  category: string;
  confidence: number;
}

const ExtractedSkillSchema = new Schema<IExtractedSkill>(
  {
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'General' },
    confidence: { type: Number, default: 0.9 }
  },
  { timestamps: true }
);

export const ExtractedSkill: Model<IExtractedSkill> =
  (mongoose.models.ExtractedSkill as Model<IExtractedSkill>) ||
  mongoose.model<IExtractedSkill>('ExtractedSkill', ExtractedSkillSchema);
export default ExtractedSkill;
