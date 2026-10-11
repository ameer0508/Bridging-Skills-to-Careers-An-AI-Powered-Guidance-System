import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICareerSimilarity extends Document<Types.ObjectId> {
  sourceCareerId: Types.ObjectId;
  targetCareerId: Types.ObjectId;
  similarityScore: number;
}

const CareerSimilaritySchema = new Schema<ICareerSimilarity>(
  {
    sourceCareerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true, index: true },
    targetCareerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
    similarityScore: { type: Number, required: true, min: 0, max: 100 }
  },
  { timestamps: true }
);

export const CareerSimilarity: Model<ICareerSimilarity> =
  (mongoose.models.CareerSimilarity as Model<ICareerSimilarity>) ||
  mongoose.model<ICareerSimilarity>('CareerSimilarity', CareerSimilaritySchema);
export default CareerSimilarity;
