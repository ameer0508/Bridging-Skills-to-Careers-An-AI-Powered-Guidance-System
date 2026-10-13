import React, { useEffect, useRef, useState } from 'react';
import { useDisclosureFocus } from './useDisclosureFocus';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mic, MicOff, ShieldAlert } from 'lucide-react';
import {
  DictationConsent,
  fetchVoiceSettings,
  onDeviceAvailability,
  recognitionConstructor,
  SpeechRecognitionLike,
  speechErrorText,
  updateVoiceSettings,
} from '../speech';

const LANG = 'en-US';
const button = 'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-50';

/**
 * Optional speech-to-text for an answer (D2). Typing always works. Dictation needs the user's
 * explicit consent, stored with the account, and says where the audio is processed. Dictated text
 * is appended to the answer box, where it stays editable.
 */
export const DictationControl: React.FC<{ onTranscript: (text: string) => void; disabled?: boolean }> = ({ onTranscript, disabled }) => {
  const queryClient = useQueryClient();
  const [ctor] = useState(() => recognitionConstructor());
  const [onDevice, setOnDevice] = useState<'available' | 'unavailable' | 'unknown'>('unknown');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askingConsent, setAskingConsent] = useState(false);
  const focus = useDisclosureFocus(askingConsent);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef(onTranscript);
  useEffect(() => {
    transcriptRef.current = onTranscript;
  }, [onTranscript]);

  const settings = useQuery({ queryKey: ['voice-settings'], queryFn: fetchVoiceSettings, retry: false, enabled: Boolean(ctor) });
  const consent: DictationConsent = settings.data?.dictationConsent ?? 'none';
  const setConsent = useMutation({
    mutationFn: (value: DictationConsent) => updateVoiceSettings({ dictationConsent: value }),
    onSuccess: data => {
      queryClient.setQueryData(['voice-settings'], data);
      setAskingConsent(false);
    },
  });

  useEffect(() => {
    if (ctor) onDeviceAvailability(ctor, LANG).then(setOnDevice);
  }, [ctor]);

  // Stop listening when the control goes away (next question, end of round)
  useEffect(() => () => recognitionRef.current?.stop(), []);

  if (!ctor) {
    return (
      <p className="text-[11px] text-slate-400" data-testid="dictation-unsupported">
        Voice dictation is not available in this browser. Type your answer: typing works everywhere and nothing is lost.
      </p>
    );
  }

  const blockedOnDevice = consent === 'on_device_only' && onDevice !== 'available';

  const start = () => {
    setError(null);
    const recognition = new ctor();
    recognition.continuous = true;
    // Final phrases only: interim results would be appended again as they are revised
    recognition.interimResults = false;
    recognition.lang = LANG;
    if (consent === 'on_device_only') recognition.processLocally = true;
    recognition.onresult = event => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) text += event.results[i][0].transcript;
      if (text.trim()) transcriptRef.current(text.trim());
    };
    recognition.onerror = event => {
      setError(speechErrorText(event?.error));
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError(speechErrorText(undefined));
    }
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div ref={focus.containerRef} tabIndex={-1} className="space-y-2 text-[11px] text-slate-300 outline-none" data-testid="dictation">
      {consent === 'none' && !askingConsent && (
        <button ref={focus.triggerRef} type="button" className={`${button} border-white/10 bg-slate-800/80 text-slate-300`} disabled={disabled || settings.isPending} onClick={() => setAskingConsent(true)}>
          <MicOff className="h-3.5 w-3.5" aria-hidden="true" /> Enable voice dictation
        </button>
      )}

      {askingConsent && (
        <div ref={focus.panelRef} tabIndex={-1} role="dialog" aria-labelledby="dictation-consent-title" className="space-y-2 rounded-xl border border-amber-400/40 bg-amber-500/5 p-3 outline-none focus-visible:ring-2 focus-visible:ring-amber-300" data-testid="dictation-consent">
          <p id="dictation-consent-title" className="flex items-center gap-1.5 font-bold text-amber-200">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" /> Before you dictate
          </p>
          <p>
            SkillBridge does not receive or store your voice. Your browser turns speech into text, and only the text goes into your
            answer, where you can edit it. Where the browser does that depends on your choice:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`${button} border-emerald-400/40 text-emerald-200`}
              disabled={onDevice !== 'available' || setConsent.isPending}
              onClick={() => setConsent.mutate('on_device_only')}
            >
              Only on this device
            </button>
            <button type="button" className={`${button} border-amber-400/40 text-amber-200`} disabled={setConsent.isPending} onClick={() => setConsent.mutate('browser_service')}>
              Allow my browser&apos;s speech service
            </button>
            <button type="button" className={`${button} border-white/10 text-slate-300`} onClick={() => setAskingConsent(false)}>
              Not now
            </button>
          </div>
          <p className="text-slate-400">
            {onDevice === 'available'
              ? 'This browser can recognise speech on the device, so audio need not leave it.'
              : 'This browser has not confirmed on-device recognition, so "Only on this device" is unavailable.'}{' '}
            &ldquo;Allow my browser&apos;s speech service&rdquo; means the browser vendor (for example Google or Microsoft) receives the audio to
            transcribe it, under its own terms. You can turn dictation off at any time.
          </p>
        </div>
      )}

      {consent !== 'none' && (
        <div className="flex flex-wrap items-center gap-2">
          {listening ? (
            <button type="button" className={`${button} animate-pulse border-rose-500 bg-rose-600/30 text-rose-200`} onClick={stop}>
              <Mic className="h-3.5 w-3.5" aria-hidden="true" /> Listening… stop
            </button>
          ) : (
            <button type="button" className={`${button} border-white/10 bg-slate-800/80 text-slate-200`} disabled={disabled || blockedOnDevice} onClick={start}>
              <Mic className="h-3.5 w-3.5" aria-hidden="true" /> Dictate
            </button>
          )}
          <button
            type="button"
            className="text-[11px] text-slate-400 underline"
            onClick={() => {
              stop();
              setConsent.mutate('none');
            }}
          >
            Turn off dictation
          </button>
          <span className="text-slate-400" data-testid="dictation-status">
            {blockedOnDevice
              ? 'You allowed on-device dictation only, and this browser cannot do that, so dictation stays off. Type your answer.'
              : consent === 'on_device_only'
                ? 'Dictation on: speech is recognised on this device.'
                : "Dictation on: your browser's speech service transcribes the audio (SkillBridge does not receive it)."}{' '}
            Dictated text can be edited before you submit.
          </span>
        </div>
      )}

      {error && <p role="alert" className="text-rose-300">{error}</p>}
      {setConsent.isError && <p role="alert" className="text-rose-300">Your dictation choice could not be saved. Dictation stays off.</p>}
    </div>
  );
};
