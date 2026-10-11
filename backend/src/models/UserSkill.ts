import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type EvidenceSourceType =
  | 'resume_experience'
  | 'resume_projects'
  | 'resume_education'
  | 'resume_certifications'
  | 'resume_skills';

export interface IEvidence {
  sourceType: EvidenceSourceType;
  sourceId?: string;
  description: string;
  weight: number;
}

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface IUserSkill extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  skillId: Types.ObjectId;
  category: string;
  // 0-100 score derived purely from where the skill appears in the resume
  evidenceScore: number;
  // Estimate derived from evidenceScore; never self-reported
  proficiency: ProficiencyLevel;
  evidences: IEvidence[];
  createdAt: Date;
  updatedAt: Date;
}

const EvidenceSchema = new Schema<IEvidence>(
  {
    sourceType: { type: String, required: true },
    sourceId: { type: String },
    description: { type: String, default: '' },
    weight: { type: Number, default: 0 }
  },
  { _id: false }
);

const UserSkillSchema = new Schema<IUserSkill>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    category: { type: String, default: 'General' },
    evidenceScore: { type: Number, default: 0, min: 0, max: 100 },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    evidences: { type: [EvidenceSchema], default: [] }
  },
  { timestamps: true }
);

export const UserSkill: Model<IUserSkill> =
  (mongoose.models.UserSkill as Model<IUserSkill>) ||
  mongoose.model<IUserSkill>('UserSkill', UserSkillSchema);
export default UserSkill;
