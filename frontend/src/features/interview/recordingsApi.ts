import apiClient from '../../lib/axios';

/** Mirrors backend/src/services/interview/VoiceRecordingService.ts (D1). */
export interface RecordingView {
  questionId: string;
  mimeType: string;
  bytes: number;
  durationSec: number | null;
  createdAt: string;
  expiresAt: string;
}

export const listRecordings = async (sessionId: string) =>
  (await apiClient.get(`/interviews/${encodeURIComponent(sessionId)}/recordings`)).data.data.recordings as RecordingView[];

export async function uploadRecording(sessionId: string, questionIndex: number, blob: Blob, durationSec: number): Promise<RecordingView> {
  const form = new FormData();
  form.append('audio', blob, 'answer.webm');
  form.append('questionIndex', String(questionIndex));
  form.append('durationSec', String(Math.round(durationSec)));
  // The client defaults to JSON; multipart lets the browser add the boundary
  return (await apiClient.post(`/interviews/${encodeURIComponent(sessionId)}/recordings`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    .data as RecordingView;
}

/** The audio as a blob, fetched with the user's credentials (a plain <audio src> could not send them). */
export const fetchRecordingAudio = async (sessionId: string, questionId: string) =>
  (await apiClient.get(`/interviews/${encodeURIComponent(sessionId)}/recordings/${encodeURIComponent(questionId)}/audio`, { responseType: 'blob' }))
    .data as Blob;

export const deleteRecording = async (sessionId: string, questionId: string) =>
  apiClient.delete(`/interviews/${encodeURIComponent(sessionId)}/recordings/${encodeURIComponent(questionId)}`);

export const deleteAllRecordings = async () => (await apiClient.delete('/interviews/recordings')).data.data.deleted as number;
