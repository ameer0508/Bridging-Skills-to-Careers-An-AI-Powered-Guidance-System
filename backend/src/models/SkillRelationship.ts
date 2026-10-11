import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillRelationship extends Document {
  sourceSkillId?: any;
  targetSkillId?: any;
  sourceSkill?: string;
  targetSkill?: string;
  relationshipType?: string;
  weight?: number;
}

const SkillRelationshipSchema = new Schema<ISkillRelationship>(
  {
    sourceSkillId: { type: Schema.Types.Mixed },
    targetSkillId: { type: Schema.Types.Mixed },
    sourceSkill: { type: String, default: '' },
    targetSkill: { type: String, default: '' },
    relationshipType: { type: String, default: 'related' },
    weight: { type: Number, default: 1.0 }
  },
  { timestamps: true }
);

export const SkillRelationship = mongoose.models.SkillRelationship || mongoose.model<ISkillRelationship>('SkillRelationship', SkillRelationshipSchema);
export default SkillRelationship;
