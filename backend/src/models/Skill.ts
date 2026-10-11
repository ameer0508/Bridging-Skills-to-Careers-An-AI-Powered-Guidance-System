import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISkill extends Document<Types.ObjectId> {
  name?: string;
  canonicalName: string;
  category: string;
  aliases: string[];
  description?: string;
  isActive: boolean;
}

const SkillSchema = new Schema<ISkill>(
  {
    name: { type: String },
    canonicalName: { type: String, required: true, trim: true, index: true },
    category: { type: String, default: 'General' },
    aliases: { type: [String], default: [] },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

SkillSchema.pre('save', function (next) {
  if (!this.name && this.canonicalName) {
    this.name = this.canonicalName;
  }
  next();
});

export const Skill: Model<ISkill> =
  (mongoose.models.Skill as Model<ISkill>) || mongoose.model<ISkill>('Skill', SkillSchema);
export default Skill;
