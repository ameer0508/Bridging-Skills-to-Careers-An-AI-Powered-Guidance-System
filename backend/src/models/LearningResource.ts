import mongoose, { Schema, Document } from 'mongoose';

export interface ILearningResource extends Document {
  title: string;
  provider?: string;
  url?: string;
  type?: string;
  targetSkills?: string[];
  level?: string;
  rating?: number;
  duration?: string;
}

const LearningResourceSchema = new Schema<ILearningResource>(
  {
    title: { type: String, required: true },
    provider: { type: String, default: '' },
    url: { type: String, default: '' },
    type: { type: String, default: 'course' },
    targetSkills: { type: [String], default: [] },
    level: { type: String, default: 'intermediate' },
    rating: { type: Number, default: 4.5 },
    duration: { type: String, default: '' }
  },
  { timestamps: true }
);

export const LearningResource = mongoose.models.LearningResource || mongoose.model<ILearningResource>('LearningResource', LearningResourceSchema);
export default LearningResource;
