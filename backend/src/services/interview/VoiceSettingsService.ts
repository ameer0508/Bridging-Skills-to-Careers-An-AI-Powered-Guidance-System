import VoiceSettings, { DictationConsent, IVoiceConsentChange, IVoiceSettings } from '../../models/VoiceSettings.js';

export const RETENTION_CHOICES = [0, 7, 30] as const;
const MAX_HISTORY = 50;

export interface VoiceSettingsView {
  dictationConsent: DictationConsent;
  recordingConsent: boolean;
  retentionDays: number;
  history: Array<{ field: string; value: string; at: string }>;
  updatedAt: string | null;
}

const DEFAULTS: VoiceSettingsView = { dictationConsent: 'none', recordingConsent: false, retentionDays: 0, history: [], updatedAt: null };

const view = (doc: IVoiceSettings | null): VoiceSettingsView =>
  doc
    ? {
        dictationConsent: doc.dictationConsent,
        recordingConsent: doc.recordingConsent,
        retentionDays: doc.retentionDays,
        history: doc.history.map(h => ({ field: h.field, value: h.value, at: h.at.toISOString() })),
        updatedAt: doc.updatedAt.toISOString(),
      }
    : DEFAULTS;

/** Voice consent and retention (D1, D2). Absent settings mean no consent of any kind. */
class VoiceSettingsService {
  async get(userId: string): Promise<VoiceSettingsView> {
    return view(await VoiceSettings.findOne({ userId }));
  }

  async update(
    userId: string,
    input: { dictationConsent?: DictationConsent; recordingConsent?: boolean; retentionDays?: (typeof RETENTION_CHOICES)[number] }
  ): Promise<VoiceSettingsView> {
    const doc = (await VoiceSettings.findOne({ userId })) ?? new VoiceSettings({ userId });
    const now = new Date();
    const changes: IVoiceConsentChange[] = [];
    if (input.dictationConsent !== undefined && input.dictationConsent !== doc.dictationConsent) {
      doc.dictationConsent = input.dictationConsent;
      changes.push({ field: 'dictationConsent', value: input.dictationConsent, at: now });
    }
    if (input.recordingConsent !== undefined && input.recordingConsent !== doc.recordingConsent) {
      doc.recordingConsent = input.recordingConsent;
      changes.push({ field: 'recordingConsent', value: String(input.recordingConsent), at: now });
    }
    if (input.retentionDays !== undefined && input.retentionDays !== doc.retentionDays) {
      doc.retentionDays = input.retentionDays;
      changes.push({ field: 'retentionDays', value: String(input.retentionDays), at: now });
    }
    if (changes.length) doc.history = [...doc.history, ...changes].slice(-MAX_HISTORY);
    if (doc.isNew || changes.length) await doc.save();
    return view(doc);
  }
}

export default new VoiceSettingsService();
