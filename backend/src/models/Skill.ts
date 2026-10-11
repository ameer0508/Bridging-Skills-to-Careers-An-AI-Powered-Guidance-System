import mongoose, { Schema, Document } from 'mongoose';

export interface ISkill extends Document {
  name?: string;
  canonicalName: string;
  category?: string;
  aliases?: string[];
  description?: string;
  isActive?: boolean;
}

const SkillSchema = new Schema<ISkill>(
  {
    name: { type: String },
    canonicalName: { type: String, required: true },
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

export const Skill = mongoose.models.Skill || mongoose.model<ISkill>('Skill', SkillSchema);
export default Skill;
