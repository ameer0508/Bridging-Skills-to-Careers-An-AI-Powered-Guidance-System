import mongoose, { Schema, Document } from 'mongoose';

export interface ICareerRequirement extends Document {
  careerId?: string;
  roleTitle: string;
  skillName: string;
  importance?: string;
  weight?: number;
  minProficiency?: number;
}

const CareerRequirementSchema = new Schema<ICareerRequirement>(
  {
    careerId: { type: String },
    roleTitle: { type: String, required: true },
    skillName: { type: String, required: true },
    importance: { type: String, default: 'required' },
    weight: { type: Number, default: 1.0 },
    minProficiency: { type: Number, default: 3 }
  },
  { timestamps: true }
);

export const CareerRequirement = mongoose.models.CareerRequirement || mongoose.model<ICareerRequirement>('CareerRequirement', CareerRequirementSchema);
export default CareerRequirement;
