import mongoose, { Schema, Document } from 'mongoose';

export interface ICertification extends Document {
  title: string;
  issuer?: string;
  url?: string;
  targetSkills?: string[];
  level?: string;
}

const CertificationSchema = new Schema<ICertification>(
  {
    title: { type: String, required: true },
    issuer: { type: String, default: '' },
    url: { type: String, default: '' },
    targetSkills: { type: [String], default: [] },
    level: { type: String, default: 'professional' }
  },
  { timestamps: true }
);

export const Certification = mongoose.models.Certification || mongoose.model<ICertification>('Certification', CertificationSchema);
export default Certification;
