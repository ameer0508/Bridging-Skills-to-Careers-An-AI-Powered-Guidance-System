import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IProjectTemplate extends Document<Types.ObjectId> {
  title: string;
  description: string;
  targetSkills: string[];
  difficulty: string;
  estimatedTime: string;
  expectedOutcome: string;
}

const ProjectTemplateSchema = new Schema<IProjectTemplate>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    targetSkills: { type: [String], default: [], index: true },
    difficulty: { type: String, default: 'Intermediate' },
    estimatedTime: { type: String, default: '' },
    expectedOutcome: { type: String, default: '' }
  },
  { timestamps: true }
);

export const ProjectTemplate: Model<IProjectTemplate> =
  (mongoose.models.ProjectTemplate as Model<IProjectTemplate>) ||
  mongoose.model<IProjectTemplate>('ProjectTemplate', ProjectTemplateSchema);
export default ProjectTemplate;
