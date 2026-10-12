import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * A spoken answer kept for the user's own review (D1). The audio file lives on SkillBridge's
 * server under a name made from ids only; it is never sent to an AI or any third party and is
 * not used for scoring. It is deleted at expiresAt, when the user deletes it, or when the user
 * withdraws recording consent.
 */
export interface IVoiceRecording extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  questionId: string;
  mimeType: string;
  bytes: number;
  /** As reported by the browser, capped at the maximum length. */
  durationSec: number | null;
  /** Server-internal; never returned by the API. */
  storagePath: string;
  expiresAt: Date;
  /**
   * Set as soon as deletion is asked for (by the user, by expiry or by withdrawn consent). From
   * then on the recording cannot be listed or played. The record itself is removed only once the
   * audio file is confirmed gone, so a file that could not be deleted is never forgotten.
   */
  deleteRequestedAt?: Date | null;
  deleteAttempts?: number;
  /** Error code of the last failed attempt (for example EPERM); never a path. */
  lastDeleteError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const VoiceRecordingSchema = new Schema<IVoiceRecording>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
    questionId: { type: String, required: true },
    mimeType: { type: String, required: true },
    bytes: { type: Number, required: true },
    durationSec: { type: Number, default: null },
    storagePath: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    deleteRequestedAt: { type: Date, default: null, index: true },
    deleteAttempts: { type: Number, default: 0 },
    lastDeleteError: { type: String, default: null },
  },
  { timestamps: true }
);

VoiceRecordingSchema.index({ userId: 1, sessionId: 1, questionId: 1 }, { unique: true });

export const VoiceRecording: Model<IVoiceRecording> =
  (mongoose.models.VoiceRecording as Model<IVoiceRecording>) || mongoose.model<IVoiceRecording>('VoiceRecording', VoiceRecordingSchema);
export default VoiceRecording;
