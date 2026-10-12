import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * A user's voice choices for interview practice (D1, D2). Nothing is allowed until the user says
 * so: the defaults are no dictation, no recording.
 *
 * - dictationConsent: 'none' | 'on_device_only' (speech recognised in the browser, audio stays on
 *   the device) | 'browser_service' (the user accepts that the browser's speech service, run by
 *   the browser vendor, receives the audio). SkillBridge itself never receives dictation audio.
 * - recordingConsent: whether answer recordings may be kept (D1), for retentionDays.
 * - history: an audit of every change, newest last.
 */
export type DictationConsent = 'none' | 'on_device_only' | 'browser_service';

export interface IVoiceConsentChange {
  field: 'dictationConsent' | 'recordingConsent' | 'retentionDays';
  value: string;
  at: Date;
}

export interface IVoiceSettings extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  dictationConsent: DictationConsent;
  recordingConsent: boolean;
  /** Days a recording is kept after the session ends; 0 deletes it when the session ends. */
  retentionDays: number;
  history: IVoiceConsentChange[];
  createdAt: Date;
  updatedAt: Date;
}

const ChangeSchema = new Schema<IVoiceConsentChange>({ field: String, value: String, at: Date }, { _id: false });

const VoiceSettingsSchema = new Schema<IVoiceSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dictationConsent: { type: String, enum: ['none', 'on_device_only', 'browser_service'], default: 'none' },
    recordingConsent: { type: Boolean, default: false },
    retentionDays: { type: Number, default: 0, min: 0, max: 30 },
    history: { type: [ChangeSchema], default: [] },
  },
  { timestamps: true }
);

export const VoiceSettings: Model<IVoiceSettings> =
  (mongoose.models.VoiceSettings as Model<IVoiceSettings>) || mongoose.model<IVoiceSettings>('VoiceSettings', VoiceSettingsSchema);
export default VoiceSettings;
