import mongoose, { Schema, Document } from 'mongoose';

export interface IEvidence {
  source: string;
  confidence: number;
  details?: Record<string, any>;
}

export interface IUserSkill extends Document {
  userId: any;
  skillId?: any;
  skillName?: string;
  proficiency?: string | number;
  category?: string;
  yearsOfExperience?: number;
  source?: string;
  confidence?: number;
  verified?: boolean;
  evidenceScore?: number;
  evidences?: IEvidence[] | any[];
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSkillSchema = new Schema<IUserSkill>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skillId: { type: Schema.Types.ObjectId, ref: 'Skill', index: true },
    skillName: { type: String, default: 'Skill' },
    proficiency: { type: Schema.Types.Mixed, default: 'intermediate' },
    category: { type: String, default: 'General' },
    yearsOfExperience: { type: Number, default: 0 },
    source: { type: String, default: 'user_input' },
    confidence: { type: Number, default: 1.0 },
    verified: { type: Boolean, default: false },
    evidenceScore: { type: Number, default: 0 },
    evidences: { type: Schema.Types.Mixed, default: [] }
  },
  { timestamps: true }
);

export const UserSkill = mongoose.models.UserSkill || mongoose.model<IUserSkill>('UserSkill', UserSkillSchema);
export default UserSkill;
