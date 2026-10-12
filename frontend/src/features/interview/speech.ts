import apiClient from '../../lib/axios';

/**
 * Browser speech-to-text for interview answers (D2). SkillBridge never receives dictation audio:
 * recognition happens in the browser, either on the device or through the browser vendor's speech
 * service, and only the resulting text goes into the answer box, where it can be edited.
 */

/** The parts of the Web Speech API used here. */
export interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
export interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  processLocally?: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
export type SpeechRecognitionConstructor = (new () => SpeechRecognitionLike) & {
  /** Newer browsers: whether recognition for these languages can run on the device. */
  available?: (options: { langs: string[]; processLocally: boolean }) => Promise<string>;
};

export function recognitionConstructor(): SpeechRecognitionConstructor | null {
  const w = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** 'available' only when the browser confirms on-device recognition for the language. */
export async function onDeviceAvailability(ctor: SpeechRecognitionConstructor, lang: string): Promise<'available' | 'unavailable' | 'unknown'> {
  if (typeof ctor.available !== 'function') return 'unknown';
  try {
    const status = await ctor.available({ langs: [lang], processLocally: true });
    return status === 'available' ? 'available' : 'unavailable';
  } catch {
    return 'unknown';
  }
}

/** A speech recognition error code, in words, with what the user can do instead. */
export function speechErrorText(code: string | undefined): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was refused, so dictation stopped. You can allow it in the browser, or type your answer.';
    case 'network':
      return "The browser's speech service could not be reached. Type your answer, or try dictation again later.";
    case 'no-speech':
      return 'No speech was heard. Try again closer to the microphone, or type your answer.';
    case 'audio-capture':
      return 'No microphone was found. Type your answer instead.';
    case 'language-not-supported':
      return 'This language is not supported for dictation here. Type your answer instead.';
    default:
      return 'Dictation stopped unexpectedly. Your text so far is kept; type the rest or try again.';
  }
}

export type DictationConsent = 'none' | 'on_device_only' | 'browser_service';

export interface VoiceSettings {
  dictationConsent: DictationConsent;
  recordingConsent: boolean;
  retentionDays: number;
  history: Array<{ field: string; value: string; at: string }>;
  updatedAt: string | null;
}

export const fetchVoiceSettings = async () => (await apiClient.get('/interviews/voice-settings')).data.data as VoiceSettings;
export const updateVoiceSettings = async (body: Partial<Pick<VoiceSettings, 'dictationConsent' | 'recordingConsent' | 'retentionDays'>>) =>
  (await apiClient.put('/interviews/voice-settings', body)).data.data as VoiceSettings;
