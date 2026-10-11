import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type RoadmapItemStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export const ROADMAP_ITEM_STATUSES: RoadmapItemStatus[] = [
  'not_started',
  'in_progress',
  'completed',
  'skipped'
];

export interface IRoadmapItem {
  _id?: Types.ObjectId;
  recommendationId?: Types.ObjectId;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  estimatedDuration?: string;
  difficulty?: string;
  prerequisites?: string[];
  careerRelevance?: string;
  expectedOutcome?: string;
  completionCriteria?: string;
  status: RoadmapItemStatus;
  targetSkill?: string;
  actionLink?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IRoadmapPhase {
  _id?: Types.ObjectId;
  title: string;
  order: number;
  objective?: string;
  skillsGained?: string[];
  expectedReadinessImprovement?: string;
  estimatedCompletionTime?: string;
  status?: RoadmapItemStatus;
  items: IRoadmapItem[];
}

export interface ILearningRoadmap extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  careerId: Types.ObjectId;
  phases: IRoadmapPhase[];
  progressPercentage: number;
  status: 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

// Items and phases are real sub-documents so that each one gets a stable _id and
// in-place status changes are tracked and persisted by Mongoose.
const RoadmapItemSchema = new Schema<IRoadmapItem>({
  recommendationId: { type: Schema.Types.ObjectId, ref: 'Recommendation' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  priority: { type: String, default: 'Medium' },
  estimatedDuration: { type: String, default: '' },
  difficulty: { type: String, default: '' },
  prerequisites: { type: [String], default: [] },
  careerRelevance: { type: String, default: '' },
  expectedOutcome: { type: String, default: '' },
  completionCriteria: { type: String, default: '' },
  status: { type: String, enum: ROADMAP_ITEM_STATUSES, default: 'not_started' },
  targetSkill: { type: String, default: '' },
  actionLink: { type: String, default: '' },
  startedAt: { type: Date },
  completedAt: { type: Date }
});

const RoadmapPhaseSchema = new Schema<IRoadmapPhase>({
  title: { type: String, required: true },
  order: { type: Number, required: true },
  objective: { type: String, default: '' },
  skillsGained: { type: [String], default: [] },
  expectedReadinessImprovement: { type: String, default: '' },
  estimatedCompletionTime: { type: String, default: '' },
  status: { type: String, enum: ROADMAP_ITEM_STATUSES, default: 'not_started' },
  items: { type: [RoadmapItemSchema], default: [] }
});

const LearningRoadmapSchema = new Schema<ILearningRoadmap>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
    phases: { type: [RoadmapPhaseSchema], default: [] },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['active', 'completed'], default: 'active' }
  },
  { timestamps: true }
);

LearningRoadmapSchema.index({ userId: 1, careerId: 1 });

export const LearningRoadmap: Model<ILearningRoadmap> =
  (mongoose.models.LearningRoadmap as Model<ILearningRoadmap>) ||
  mongoose.model<ILearningRoadmap>('LearningRoadmap', LearningRoadmapSchema);
export default LearningRoadmap;
