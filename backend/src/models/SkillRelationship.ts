import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISkillRelationship extends Document<Types.ObjectId> {
  sourceSkillId: Types.ObjectId;
  targetSkillId: Types.ObjectId;
  relationshipType: string;
  weight: number;
}

const SkillRelationshipSchema = new Schema<ISkillRelationship>(
  {
    sourceSkillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    targetSkillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    relationshipType: { type: String, default: 'related' },
    weight: { type: Number, default: 1.0 }
  },
  { timestamps: true }
);

export const SkillRelationship: Model<ISkillRelationship> =
  (mongoose.models.SkillRelationship as Model<ISkillRelationship>) ||
  mongoose.model<ISkillRelationship>('SkillRelationship', SkillRelationshipSchema);
export default SkillRelationship;
