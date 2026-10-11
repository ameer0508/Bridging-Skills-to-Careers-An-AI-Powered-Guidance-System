import mongoose, { Schema, Document } from 'mongoose';

export interface ICareerSimilarity extends Document {
  careerA: string;
  careerB: string;
  similarityScore: number;
  sharedSkills?: string[];
}

const CareerSimilaritySchema = new Schema<ICareerSimilarity>(
  {
    careerA: { type: String, required: true },
    careerB: { type: String, required: true },
    similarityScore: { type: Number, required: true },
    sharedSkills: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const CareerSimilarity = mongoose.models.CareerSimilarity || mongoose.model<ICareerSimilarity>('CareerSimilarity', CareerSimilaritySchema);
export default CareerSimilarity;
