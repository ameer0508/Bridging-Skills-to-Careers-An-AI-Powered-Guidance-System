import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ILearningResource extends Document<Types.ObjectId> {
  title: string;
  provider: string;
  url: string;
  type: string;
  targetSkills: string[];
  difficulty: string;
  estimatedTime: string;
}

const LearningResourceSchema = new Schema<ILearningResource>(
  {
    title: { type: String, required: true },
    provider: { type: String, default: '' },
    url: { type: String, default: '' },
    type: { type: String, default: 'Course' },
    targetSkills: { type: [String], default: [], index: true },
    difficulty: { type: String, default: 'Intermediate' },
    estimatedTime: { type: String, default: '' }
  },
  { timestamps: true }
);

export const LearningResource: Model<ILearningResource> =
  (mongoose.models.LearningResource as Model<ILearningResource>) ||
  mongoose.model<ILearningResource>('LearningResource', LearningResourceSchema);
export default LearningResource;
