import mongoose, { Schema, Document } from 'mongoose';

export enum RoadmapItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export interface IRoadmapItem {
  id?: string;
  title: string;
  description?: string;
  type?: string;
  status?: string;
  resourceUrl?: string;
}

export interface IRoadmapPhase {
  phaseNumber?: number;
  order?: number;
  title: string;
  objective?: string;
  description?: string;
  durationMonths?: number;
  items: IRoadmapItem[];
  status?: string;
}

export interface ILearningRoadmap extends Document {
  userId: any;
  targetRole: string;
  targetMonths?: number;
  phases: IRoadmapPhase[];
  status?: string;
}

const LearningRoadmapSchema = new Schema<ILearningRoadmap>(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    targetRole: { type: String, required: true },
    targetMonths: { type: Number, default: 6 },
    phases: { type: Schema.Types.Mixed, default: [] },
    status: { type: String, default: 'active' }
  },
  { timestamps: true }
);

export const LearningRoadmap = mongoose.models.LearningRoadmap || mongoose.model<ILearningRoadmap>('LearningRoadmap', LearningRoadmapSchema);
export default LearningRoadmap;
