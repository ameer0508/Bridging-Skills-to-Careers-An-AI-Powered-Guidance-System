import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ResumeUploadStatus = 'active' | 'replaced' | 'deleted';
export type ResumeParsingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IResumeSkillChanges {
  /** False for a first upload, where there was nothing to compare against. */
  comparedToPrevious: boolean;
  added: string[];
  removed: string[];
  unchangedCount: number;
}

export interface IResume extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  originalFileName: string;
  storedFileName: string;
  fileExtension: string;
  mimeType: string;
  fileSize: number;
  storageProvider: string;
  storagePath: string;
  isActive: boolean;
  uploadStatus: ResumeUploadStatus;
  parsingStatus: ResumeParsingStatus;
  parsingError?: string;
  parsingStartedAt?: Date;
  /** What changed in the recognised skills compared with the user's previous skill profile. */
  skillChanges?: IResumeSkillChanges;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalFileName: { type: String, required: true },
    storedFileName: { type: String, required: true },
    fileExtension: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    storageProvider: { type: String, default: 'local' },
    storagePath: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    uploadStatus: { type: String, enum: ['active', 'replaced', 'deleted'], default: 'active' },
    parsingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    parsingError: { type: String },
    skillChanges: {
      type: new Schema(
        {
          comparedToPrevious: { type: Boolean, default: false },
          added: { type: [String], default: [] },
          removed: { type: [String], default: [] },
          unchangedCount: { type: Number, default: 0 },
        },
        { _id: false }
      ),
    },
    parsingStartedAt: { type: Date },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ResumeSchema.index({ userId: 1, isActive: 1 });

export const Resume: Model<IResume> =
  (mongoose.models.Resume as Model<IResume>) || mongoose.model<IResume>('Resume', ResumeSchema);
export default Resume;
