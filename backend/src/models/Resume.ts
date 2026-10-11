import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  userId: any;
  fileName?: string;
  originalFileName?: string;
  storedFileName?: string;
  fileExtension?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  storageProvider?: string;
  storagePath?: string;
  isActive?: boolean;
  uploadStatus?: string;
  parsingStatus?: string;
  parsingError?: string;
  parsedContent?: Record<string, any>;
  uploadedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    fileName: { type: String, default: 'resume.pdf' },
    originalFileName: { type: String, default: 'resume.pdf' },
    storedFileName: { type: String, default: '' },
    fileExtension: { type: String, default: '.pdf' },
    fileUrl: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: 'application/pdf' },
    storageProvider: { type: String, default: 'local' },
    storagePath: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    uploadStatus: { type: String, default: 'active' },
    parsingStatus: { type: String, default: 'completed' },
    parsingError: { type: String },
    parsedContent: { type: Schema.Types.Mixed, default: {} },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Resume = mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
export default Resume;
