import mongoose, { Schema, Document } from 'mongoose';

export interface ICareer extends Document {
  title: string;
  slug?: string;
  domain?: string;
  description?: string;
  averageSalary?: number;
  demandLevel?: string;
  requiredSkills?: string[] | any[];
  preferredSkills?: string[] | any[];
}

const CareerSchema = new Schema<ICareer>(
  {
    title: { type: String, required: true, unique: true },
    slug: { type: String },
    domain: { type: String, default: 'Technology' },
    description: { type: String, default: '' },
    averageSalary: { type: Number, default: 0 },
    demandLevel: { type: String, default: 'High' },
    requiredSkills: { type: Schema.Types.Mixed, default: [] },
    preferredSkills: { type: Schema.Types.Mixed, default: [] }
  },
  { timestamps: true }
);

export const Career = mongoose.models.Career || mongoose.model<ICareer>('Career', CareerSchema);
export default Career;
