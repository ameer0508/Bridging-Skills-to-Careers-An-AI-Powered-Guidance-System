import mongoose, { Schema, Document } from 'mongoose';

export interface IParsedResume extends Document {
  resumeId?: any;
  userId: any;
  rawText?: string;
  contactInfo?: Record<string, any>;
  personalInfo?: Record<string, any>;
  skills?: any[];
  experience?: any[];
  education?: any[];
  projects?: any[];
  certifications?: any[];
  summary?: string;
  atsScore?: number;
  sectionHealth?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ParsedResumeSchema = new Schema<IParsedResume>(
  {
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rawText: { type: String, default: '' },
    contactInfo: { type: Schema.Types.Mixed, default: {} },
    personalInfo: { type: Schema.Types.Mixed, default: {} },
    skills: { type: Schema.Types.Mixed, default: [] },
    experience: { type: Schema.Types.Mixed, default: [] },
    education: { type: Schema.Types.Mixed, default: [] },
    projects: { type: Schema.Types.Mixed, default: [] },
    certifications: { type: Schema.Types.Mixed, default: [] },
    summary: { type: String, default: '' },
    atsScore: { type: Number, default: 0 },
    sectionHealth: { type: Schema.Types.Mixed, default: [] }
  },
  { timestamps: true }
);

export const ParsedResume = mongoose.models.ParsedResume || mongoose.model<IParsedResume>('ParsedResume', ParsedResumeSchema);
export default ParsedResume;
