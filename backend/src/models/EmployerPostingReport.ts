import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export const REPORT_REASONS = ['not_a_real_job', 'misleading', 'discriminatory', 'scam_or_fee', 'duplicate', 'other'] as const;

/** A signed-in user's report about an employer posting. `userId` is the reporter. */
export interface IEmployerPostingReport extends Document<Types.ObjectId> {
  postingId: Types.ObjectId;
  userId: Types.ObjectId;
  reason: (typeof REPORT_REASONS)[number];
  note: string;
  createdAt: Date;
}

const EmployerPostingReportSchema = new Schema<IEmployerPostingReport>(
  {
    postingId: { type: Schema.Types.ObjectId, ref: 'EmployerPosting', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

EmployerPostingReportSchema.index({ postingId: 1, userId: 1 }, { unique: true });

export const EmployerPostingReport: Model<IEmployerPostingReport> =
  (mongoose.models.EmployerPostingReport as Model<IEmployerPostingReport>) ||
  mongoose.model<IEmployerPostingReport>('EmployerPostingReport', EmployerPostingReportSchema);
export default EmployerPostingReport;
