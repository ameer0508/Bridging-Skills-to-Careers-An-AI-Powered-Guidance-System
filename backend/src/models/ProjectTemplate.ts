import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectTemplate extends Document {
  title: string;
  description?: string;
  difficulty?: string;
  targetSkills?: string[];
  deliverables?: string[];
}

const ProjectTemplateSchema = new Schema<IProjectTemplate>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    difficulty: { type: String, default: 'intermediate' },
    targetSkills: { type: [String], default: [] },
    deliverables: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const ProjectTemplate = mongoose.models.ProjectTemplate || mongoose.model<IProjectTemplate>('ProjectTemplate', ProjectTemplateSchema);
export default ProjectTemplate;
