import React, { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';

/** On-device voices only: a network voice would send the question text to the voice provider. */
const localVoice = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices().filter(v => v.localService);
  return voices.find(v => v.lang.startsWith('en')) ?? voices[0] ?? null;
};

/** Reads the question aloud for a spoken interview (D1). Hidden when no on-device voice exists. */
export const ReadAloudButton: React.FC<{ text: string }> = ({ text }) => {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(() => localVoice());

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const update = () => setVoice(localVoice());
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', update);
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!voice) return null;
  return (
    <button
      type="button"
      data-testid="read-aloud"
      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 px-3 py-1.5 text-[11px] font-bold text-slate-200"
      onClick={() => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.lang = voice.lang;
        window.speechSynthesis.speak(utterance);
      }}
    >
      <Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> Read question aloud
    </button>
  );
};
