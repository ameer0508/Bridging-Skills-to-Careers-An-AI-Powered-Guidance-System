import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type LearningProjectStatus = 'planned' | 'in_progress' | 'completed';
export const LEARNING_PROJECT_STATUSES: LearningProjectStatus[] = ['planned', 'in_progress', 'completed'];

export interface ILearningProjectTask {
  text: string;
  done: boolean;
}

/**
 * A practice project the user has taken on from a suggestion. The tasks and skills are copied
 * from the brief when it is started, so a later change to the brief does not rewrite it.
 *
 * Its status is the user's own report. A project here is never skill evidence by itself.
 */
export interface ILearningProject extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  careerId: Types.ObjectId;
  briefId: string;
  title: string;
  summary: string;
  /** Skills from the user's gaps that the project was suggested for. */
  targetSkills: string[];
  tasks: ILearningProjectTask[];
  deliverables: string[];
  effortHours: { low: number; high: number };
  status: LearningProjectStatus;
  startedAt?: Date;
  completedAt?: Date;
  briefsVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ILearningProjectTask>({ text: { type: String, required: true }, done: { type: Boolean, default: false } }, { _id: false });

const LearningProjectSchema = new Schema<ILearningProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
    briefId: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    targetSkills: { type: [String], default: [] },
    tasks: { type: [TaskSchema], default: [] },
    deliverables: { type: [String], default: [] },
    effortHours: { low: { type: Number, required: true }, high: { type: Number, required: true } },
    status: { type: String, enum: LEARNING_PROJECT_STATUSES, default: 'planned' },
    startedAt: { type: Date },
    completedAt: { type: Date },
    briefsVersion: { type: String, required: true }
  },
  { timestamps: true }
);

// A brief is taken on once per user
LearningProjectSchema.index({ userId: 1, briefId: 1 }, { unique: true });

export const LearningProject: Model<ILearningProject> =
  (mongoose.models.LearningProject as Model<ILearningProject>) || mongoose.model<ILearningProject>('LearningProject', LearningProjectSchema);
export default LearningProject;
