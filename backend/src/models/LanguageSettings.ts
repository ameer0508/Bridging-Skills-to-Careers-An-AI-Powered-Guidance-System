import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/** The interface language a user chose (E5). Absent settings mean English. */
export const UI_LANGUAGES = ['en', 'hi', 'es'] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];

export interface ILanguageSettings extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  uiLanguage: UiLanguage;
  createdAt: Date;
  updatedAt: Date;
}

const LanguageSettingsSchema = new Schema<ILanguageSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    uiLanguage: { type: String, enum: UI_LANGUAGES, default: 'en' },
  },
  { timestamps: true }
);

export const LanguageSettings: Model<ILanguageSettings> =
  (mongoose.models.LanguageSettings as Model<ILanguageSettings>) || mongoose.model<ILanguageSettings>('LanguageSettings', LanguageSettingsSchema);
export default LanguageSettings;
