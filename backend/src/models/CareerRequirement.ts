import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type RequirementImportance = 'required' | 'preferred' | 'supporting';

export interface ICareerRequirement extends Document<Types.ObjectId> {
  careerId: Types.ObjectId;
  skillName: string;
  importance: RequirementImportance;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}

const CareerRequirementSchema = new Schema<ICareerRequirement>(
  {
    careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true, index: true },
    skillName: { type: String, required: true, trim: true },
    importance: {
      type: String,
      enum: ['required', 'preferred', 'supporting'],
      default: 'required'
    },
    // Relative weight of the skill inside the career (1-5)
    weight: { type: Number, default: 3, min: 1, max: 5 }
  },
  { timestamps: true }
);

export const CareerRequirement: Model<ICareerRequirement> =
  (mongoose.models.CareerRequirement as Model<ICareerRequirement>) ||
  mongoose.model<ICareerRequirement>('CareerRequirement', CareerRequirementSchema);
export default CareerRequirement;
