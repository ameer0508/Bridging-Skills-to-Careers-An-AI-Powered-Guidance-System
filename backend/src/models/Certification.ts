import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICertification extends Document<Types.ObjectId> {
  title: string;
  provider: string;
  url: string;
  targetSkills: string[];
  difficulty: string;
  estimatedTime: string;
}

const CertificationSchema = new Schema<ICertification>(
  {
    title: { type: String, required: true },
    provider: { type: String, default: '' },
    url: { type: String, default: '' },
    targetSkills: { type: [String], default: [], index: true },
    difficulty: { type: String, default: 'Intermediate' },
    estimatedTime: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Certification: Model<ICertification> =
  (mongoose.models.Certification as Model<ICertification>) ||
  mongoose.model<ICertification>('Certification', CertificationSchema);
export default Certification;
