import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * A multilingual resume analysis (E5, X1), kept for the user who ran it. The original extracted
 * lines are stored so every field can be traced to the text it came from; the user can delete the
 * analysis, which removes them. It is separate from the main resume record and does not change
 * skills, matches or readiness (see docs/MULTILINGUAL.md for the adapter contract).
 */
export interface IResumeLanguageAnalysis extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  /** File name as shown to the user (base name only, trimmed); never used as a path. */
  fileName: string;
  fileType: string;
  method: string;
  status: 'extracted' | 'unsupported' | 'scanned_unreadable';
  language: Record<string, unknown>;
  layout: Record<string, unknown>;
  textQuality: 'ok' | 'degraded';
  warnings: string[];
  sections: Array<Record<string, unknown>>;
  fields: Record<string, unknown>;
  originalLines: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ResumeLanguageAnalysisSchema = new Schema<IResumeLanguageAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, default: '' },
    fileType: { type: String, required: true },
    method: { type: String, required: true },
    status: { type: String, enum: ['extracted', 'unsupported', 'scanned_unreadable'], required: true },
    language: { type: Schema.Types.Mixed, default: {} },
    layout: { type: Schema.Types.Mixed, default: {} },
    textQuality: { type: String, enum: ['ok', 'degraded'], default: 'ok' },
    warnings: { type: [String], default: [] },
    sections: { type: Schema.Types.Mixed, default: () => [] },
    fields: { type: Schema.Types.Mixed, default: {} },
    originalLines: { type: [String], default: [] },
  },
  { timestamps: true }
);

ResumeLanguageAnalysisSchema.index({ userId: 1, createdAt: -1 });

export const ResumeLanguageAnalysis: Model<IResumeLanguageAnalysis> =
  (mongoose.models.ResumeLanguageAnalysis as Model<IResumeLanguageAnalysis>) ||
  mongoose.model<IResumeLanguageAnalysis>('ResumeLanguageAnalysis', ResumeLanguageAnalysisSchema);
export default ResumeLanguageAnalysis;
