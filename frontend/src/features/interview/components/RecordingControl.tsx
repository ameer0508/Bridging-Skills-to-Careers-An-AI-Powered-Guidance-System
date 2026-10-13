import React, { useEffect, useRef, useState } from 'react';
import { ErrorRegion } from './AnnouncedError';
import { useAnnouncedError } from './useAnnouncedError';
import { useDisclosureFocus } from './useDisclosureFocus';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Circle, ShieldAlert, Square, Trash2 } from 'lucide-react';
import { messageOf } from '../../../lib/collections';
import { fetchVoiceSettings, updateVoiceSettings } from '../speech';
import { deleteRecording, fetchRecordingAudio, listRecordings, uploadRecording } from '../recordingsApi';

const MAX_SECONDS = 180;
const button = 'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-50';
const RETENTION_LABEL: Record<number, string> = { 0: 'until this round ends', 7: '7 days', 30: '30 days' };

const supported = () =>
  typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

/**
 * Recording a spoken answer for self-review (D1). Off until the user consents and picks how long
 * recordings are kept. Recordings stay on SkillBridge's server, are playable only by their owner,
 * are not sent to any AI or third party and do not affect the score.
 */
export const RecordingControl: React.FC<{ sessionId: string; questionIndex: number; questionId: string; disabled?: boolean }> = ({
  sessionId,
  questionIndex,
  questionId,
  disabled,
}) => {
  const queryClient = useQueryClient();
  const [asking, setAsking] = useState(false);
  const focus = useDisclosureFocus(asking);
  const [retention, setRetention] = useState<0 | 7 | 30>(0);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const { error, errorId, setError } = useAnnouncedError();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const startedRef = useRef(0);

  const settings = useQuery({ queryKey: ['voice-settings'], queryFn: fetchVoiceSettings, retry: false });
  const recordings = useQuery({
    queryKey: ['recordings', sessionId],
    queryFn: () => listRecordings(sessionId),
    retry: false,
    enabled: Boolean(settings.data?.recordingConsent),
  });
  const mine = recordings.data?.find(r => r.questionId === questionId) ?? null;

  const consent = useMutation({
    mutationFn: (body: { recordingConsent: boolean; retentionDays?: 0 | 7 | 30 }) => updateVoiceSettings(body),
    onSuccess: data => {
      queryClient.setQueryData(['voice-settings'], data);
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      setAsking(false);
    },
  });
  const upload = useMutation({
    mutationFn: ({ blob, duration }: { blob: Blob; duration: number }) => uploadRecording(sessionId, questionIndex, blob, duration),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recordings', sessionId] }),
    onError: e => setError(messageOf(e, 'The recording could not be saved.')),
  });
  const remove = useMutation({
    mutationFn: () => deleteRecording(sessionId, questionId),
    onSuccess: () => {
      setPlayUrl(null);
      queryClient.invalidateQueries({ queryKey: ['recordings', sessionId] });
    },
  });

  // A new question starts with nothing loaded; object URLs are released
  useEffect(() => {
    setPlayUrl(null);
    setError(null);
  }, [questionId, setError]);
  useEffect(() => () => {
    if (playUrl) URL.revokeObjectURL(playUrl);
  }, [playUrl]);
  useEffect(() => () => recorderRef.current?.stop(), []);
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      const elapsed = Math.round((Date.now() - startedRef.current) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_SECONDS) recorderRef.current?.stop();
    }, 500);
    return () => clearInterval(timer);
  }, [recording]);

  if (!supported()) {
    return (
      <p className="text-[11px] text-slate-400" data-testid="recording-unsupported">
        Recording answers is not available in this browser. Typed answers work as usual.
      </p>
    );
  }

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
        const duration = (Date.now() - startedRef.current) / 1000;
        const blob = new Blob(chunks, { type: (recorder.mimeType || 'audio/webm').split(';')[0] });
        if (blob.size > 0) upload.mutate({ blob, duration });
      };
      recorderRef.current = recorder;
      startedRef.current = Date.now();
      setSeconds(0);
      recorder.start();
      setRecording(true);
    } catch {
      setError('The microphone could not be used. Allow it in the browser, or answer by typing.');
    }
  };

  const play = async () => {
    try {
      const blob = await fetchRecordingAudio(sessionId, questionId);
      setPlayUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(messageOf(e, 'The recording could not be loaded.'));
    }
  };

  if (!settings.data?.recordingConsent) {
    return (
      <div ref={focus.containerRef} tabIndex={-1} className="space-y-2 text-[11px] text-slate-300 outline-none" data-testid="recording">
        {!asking ? (
          <button ref={focus.triggerRef} type="button" className={`${button} border-white/10 bg-slate-800/80 text-slate-300`} disabled={disabled || settings.isPending} onClick={() => setAsking(true)}>
            <Circle className="h-3.5 w-3.5" aria-hidden="true" /> Record spoken answers
          </button>
        ) : (
          <div ref={focus.panelRef} tabIndex={-1} role="dialog" aria-labelledby="recording-consent-title" className="space-y-2 rounded-xl border border-amber-400/40 bg-amber-500/5 p-3 outline-none focus-visible:ring-2 focus-visible:ring-amber-300" data-testid="recording-consent">
            <p id="recording-consent-title" className="flex items-center gap-1.5 font-bold text-amber-200">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" /> Before you record
            </p>
            <p>
              Recordings are stored on SkillBridge&apos;s server so you can listen back to your delivery. Only you can play them. They are not sent to
              any AI or other company, are not transcribed, and do not change your score. You can delete them at any time, and turning recording off
              deletes all of them.
            </p>
            <label className="flex items-center gap-2">
              Keep recordings
              <select className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-[11px]" value={retention} onChange={e => setRetention(Number(e.target.value) as 0 | 7 | 30)}>
                <option value={0}>until this round ends</option>
                <option value={7}>for 7 days</option>
                <option value={30}>for 30 days</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button type="button" className={`${button} border-amber-400/40 text-amber-200`} disabled={consent.isPending} onClick={() => consent.mutate({ recordingConsent: true, retentionDays: retention })}>
                Allow recording
              </button>
              <button type="button" className={`${button} border-white/10 text-slate-300`} onClick={() => setAsking(false)}>
                Not now
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 text-[11px] text-slate-300" data-testid="recording">
      <div className="flex flex-wrap items-center gap-2">
        {recording ? (
          <button type="button" className={`${button} animate-pulse border-rose-500 bg-rose-600/30 text-rose-200`} onClick={() => recorderRef.current?.stop()}>
            <Square className="h-3.5 w-3.5" aria-hidden="true" /> Stop recording ({seconds}s / {MAX_SECONDS}s)
          </button>
        ) : (
          <button type="button" className={`${button} border-white/10 bg-slate-800/80 text-slate-200`} disabled={disabled || upload.isPending} onClick={start}>
            <Circle className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" /> {mine ? 'Record again' : 'Record answer'}
          </button>
        )}
        {mine && !recording && (
          <>
            <button type="button" className={`${button} border-white/10 text-slate-200`} onClick={play}>Listen</button>
            <button type="button" className={`${button} border-white/10 text-slate-300`} disabled={remove.isPending} onClick={() => remove.mutate()}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete recording
            </button>
          </>
        )}
        <button
          type="button"
          className="text-[11px] text-slate-400 underline"
          onClick={() => {
            if (window.confirm('Turn off recording? All your recordings will be deleted.')) consent.mutate({ recordingConsent: false });
          }}
        >
          Turn off recording
        </button>
      </div>
      <p className="text-slate-400" data-testid="recording-status">
        {upload.isPending
          ? 'Saving the recording…'
          : mine
            ? `Recording saved (${mine.durationSec ?? '?'}s). Kept ${RETENTION_LABEL[settings.data.retentionDays] ?? `${settings.data.retentionDays} days`}, until ${new Date(mine.expiresAt).toLocaleString()}.`
            : `Recording is on. Recordings are kept ${RETENTION_LABEL[settings.data.retentionDays] ?? `${settings.data.retentionDays} days`} and only you can play them.`}
      </p>
      {playUrl && <audio controls src={playUrl} data-testid="recording-player" className="w-full max-w-sm" />}
      <ErrorRegion error={error} errorId={errorId} testId="recording-errors" />
    </div>
  );
};
