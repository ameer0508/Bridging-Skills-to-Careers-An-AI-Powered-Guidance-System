import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/** One step of a career transition: a career to become a fit for, and what it takes. */
export interface ITransitionStage {
  order: number;
  careerId: Types.ObjectId;
  careerTitle: string;
  /** Requirements of this stage's career the user did not yet cover when the plan was made. */
  skillsToAcquire: string[];
  /** Match score for this career when the plan was created. */
  scoreAtCreation: number;
  /** Hypothetical score once this stage's skills are acquired with project-level evidence. */
  projectedScore: number;
}

export interface ITransitionPlan extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  targetCareerId: Types.ObjectId;
  targetCareerTitle: string;
  stages: ITransitionStage[];
  /** Versions the plan was computed with; a plan made under other versions is shown as outdated. */
  scoringVersion: string;
  taxonomyVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const StageSchema = new Schema<ITransitionStage>(
  {
    order: { type: Number, required: true },
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
    careerTitle: { type: String, required: true },
    skillsToAcquire: { type: [String], default: [] },
    scoreAtCreation: { type: Number, required: true },
    projectedScore: { type: Number, required: true }
  },
  { _id: false }
);

const TransitionPlanSchema = new Schema<ITransitionPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetCareerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
    targetCareerTitle: { type: String, required: true },
    stages: { type: [StageSchema], default: [] },
    scoringVersion: { type: String, required: true },
    taxonomyVersion: { type: String, required: true }
  },
  { timestamps: true }
);

// One plan per user and target; creating it again replaces it
TransitionPlanSchema.index({ userId: 1, targetCareerId: 1 }, { unique: true });

export const TransitionPlan: Model<ITransitionPlan> =
  (mongoose.models.TransitionPlan as Model<ITransitionPlan>) ||
  mongoose.model<ITransitionPlan>('TransitionPlan', TransitionPlanSchema);
export default TransitionPlan;
