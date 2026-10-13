import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * A user's study plan for one exam pilot (E4). Completed items are kept as they are whenever the
 * plan is regenerated; only pending work is re-planned. Hours are SkillBridge estimates.
 */
export interface IStudyPlanItem {
  _id?: Types.ObjectId;
  topicId: string;
  sectionId: string;
  kind: 'learn' | 'practise' | 'revise';
  hours: number;
  week: number;
  reason: string;
  status: 'pending' | 'done';
  completedAt?: Date | null;
}

export interface IExamStudyPlan extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  examId: string;
  syllabusVersion: string;
  hoursPerWeek: number;
  startDate: Date;
  items: IStudyPlanItem[];
  generatedAt: Date;
  regenerations: number;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IStudyPlanItem>(
  {
    topicId: { type: String, required: true },
    sectionId: { type: String, required: true },
    kind: { type: String, enum: ['learn', 'practise', 'revise'], required: true },
    hours: { type: Number, required: true },
    week: { type: Number, required: true },
    reason: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'done'], default: 'pending' },
    completedAt: { type: Date, default: null },
  },
  { _id: true }
);

const ExamStudyPlanSchema = new Schema<IExamStudyPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    examId: { type: String, required: true },
    syllabusVersion: { type: String, required: true },
    hoursPerWeek: { type: Number, required: true, min: 1, max: 60 },
    startDate: { type: Date, required: true },
    items: { type: [ItemSchema], default: [] },
    generatedAt: { type: Date, required: true },
    regenerations: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ExamStudyPlanSchema.index({ userId: 1, examId: 1 }, { unique: true });

export const ExamStudyPlan: Model<IExamStudyPlan> =
  (mongoose.models.ExamStudyPlan as Model<IExamStudyPlan>) || mongoose.model<IExamStudyPlan>('ExamStudyPlan', ExamStudyPlanSchema);
export default ExamStudyPlan;
