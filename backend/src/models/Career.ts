import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICareer extends Document<Types.ObjectId> {
  title: string;
  slug?: string;
  category: string;
  domain: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CareerSchema = new Schema<ICareer>(
  {
    title: { type: String, required: true, unique: true, trim: true },
    slug: { type: String },
    // Fine-grained family shown in the UI (e.g. "Engineering", "Data")
    category: { type: String, default: 'General' },
    // Broad onboarding domain the career belongs to (e.g. "Software Engineering")
    domain: { type: String, default: 'Technology' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Career: Model<ICareer> =
  (mongoose.models.Career as Model<ICareer>) || mongoose.model<ICareer>('Career', CareerSchema);
export default Career;
