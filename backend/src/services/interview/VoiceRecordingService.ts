import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import env from '../../config/env.js';
import VoiceRecording, { IVoiceRecording } from '../../models/VoiceRecording.js';
import InterviewSession from '../../models/InterviewSession.js';
import VoiceSettingsService from './VoiceSettingsService.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../config/logger.js';

/**
 * Spoken answers for self-review (D1); see docs/INTERVIEWS.md.
 *
 * - Only with recordingConsent, checked on every upload.
 * - Stored on this server only, named from ids (no user-supplied names or paths). Not sent to any
 *   AI or third party, not transcribed by SkillBridge, not used for scoring.
 * - Only audio is accepted: the declared type must be allowed and the file must start with that
 *   format's signature. At most MAX_RECORDING_BYTES and MAX_RECORDING_SECONDS.
 * - Expiry: retentionDays after upload (0 means when the session ends, and at most 24 hours).
 *   Expired recordings are purged whenever recordings are touched and by
 *   scripts/purgeVoiceRecordings.ts; withdrawing consent deletes all of the user's recordings.
 */

export const MAX_RECORDING_BYTES = 5 * 1024 * 1024;
export const MAX_RECORDING_SECONDS = 180;
const SAME_DAY_MS = 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const FORMATS: Array<{ mime: string; ext: string; matches: (b: Buffer) => boolean }> = [
  { mime: 'audio/webm', ext: 'webm', matches: b => b.length > 4 && b.readUInt32BE(0) === 0x1a45dfa3 },
  { mime: 'audio/ogg', ext: 'ogg', matches: b => b.length > 4 && b.toString('ascii', 0, 4) === 'OggS' },
  { mime: 'audio/mp4', ext: 'm4a', matches: b => b.length > 8 && b.toString('ascii', 4, 8) === 'ftyp' },
  { mime: 'audio/wav', ext: 'wav', matches: b => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WAVE' },
];

/** The base type of a MIME value such as "audio/webm;codecs=opus". */
const baseType = (mime: string) => mime.split(';')[0].trim().toLowerCase();

export function detectAudioFormat(declaredMime: string, buffer: Buffer): { mime: string; ext: string } | null {
  const format = FORMATS.find(f => f.mime === baseType(declaredMime));
  return format && format.matches(buffer) ? { mime: format.mime, ext: format.ext } : null;
}

export const recordingRoot = () => path.resolve(process.env.VOICE_RECORDING_DIR || path.join(path.resolve(env.UPLOAD_DIR), '..', 'voice-recordings'));

export interface RecordingView {
  questionId: string;
  mimeType: string;
  bytes: number;
  durationSec: number | null;
  createdAt: string;
  expiresAt: string;
}

const view = (r: IVoiceRecording): RecordingView => ({
  questionId: r.questionId,
  mimeType: r.mimeType,
  bytes: r.bytes,
  durationSec: r.durationSec,
  createdAt: r.createdAt.toISOString(),
  expiresAt: r.expiresAt.toISOString(),
});

async function removeFiles(records: IVoiceRecording[]) {
  for (const r of records) {
    try {
      await fs.promises.rm(r.storagePath, { force: true });
    } catch (error) {
      logger.warn(`Could not remove voice recording file: ${(error as Error).message}`);
    }
  }
  if (records.length) await VoiceRecording.deleteMany({ _id: { $in: records.map(r => r._id) } });
}

class VoiceRecordingService {
  private async ownedSession(userId: string, sessionId: string) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) throw new AppError('Interview session not found or access denied', 404, 'INTERVIEW_NOT_FOUND');
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) throw new AppError('Interview session not found or access denied', 404, 'INTERVIEW_NOT_FOUND');
    return session;
  }

  /** Deletes every recording past its expiry; returns how many were removed. */
  async purgeExpired(now = new Date()): Promise<number> {
    const expired = await VoiceRecording.find({ expiresAt: { $lte: now } });
    await removeFiles(expired);
    return expired.length;
  }

  async upload(
    userId: string,
    sessionId: string,
    input: { questionIndex: number; durationSec?: number; mimeType: string; buffer: Buffer }
  ): Promise<RecordingView> {
    await this.purgeExpired();
    const settings = await VoiceSettingsService.get(userId);
    if (!settings.recordingConsent) {
      throw new AppError('Recording is off. Turn on answer recording, and choose how long to keep recordings, before recording.', 403, 'RECORDING_CONSENT_REQUIRED');
    }
    const session = await this.ownedSession(userId, sessionId);
    if (session.status !== 'active') throw new AppError('This interview has ended; recordings can only be added during a round.', 409, 'INTERVIEW_NOT_ACTIVE');
    const question = session.questions[input.questionIndex];
    if (!question) throw new AppError('Invalid question index', 400, 'INVALID_QUESTION_INDEX');
    if (input.buffer.length === 0) throw new AppError('The recording is empty.', 400, 'EMPTY_FILE');
    if (input.buffer.length > MAX_RECORDING_BYTES) throw new AppError('The recording is too large (5 MB at most).', 400, 'FILE_TOO_LARGE');
    const format = detectAudioFormat(input.mimeType, input.buffer);
    if (!format) throw new AppError('Only WebM, Ogg, MP4 or WAV audio is accepted.', 400, 'INVALID_AUDIO');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (settings.retentionDays === 0 ? SAME_DAY_MS : settings.retentionDays * DAY_MS));
    const dir = path.join(recordingRoot(), String(session.userId), String(session._id));
    await fs.promises.mkdir(dir, { recursive: true });
    // The file name is built from ids only
    const storagePath = path.join(dir, `${encodeURIComponent(question.questionId)}.${format.ext}`);
    if (!storagePath.startsWith(recordingRoot() + path.sep)) throw new AppError('Invalid recording path', 400, 'INVALID_PATH');

    const previous = await VoiceRecording.findOne({ userId, sessionId: session._id, questionId: question.questionId });
    if (previous) await removeFiles([previous]);
    await fs.promises.writeFile(storagePath, input.buffer, { mode: 0o600 });
    const record = await VoiceRecording.create({
      userId,
      sessionId: session._id,
      questionId: question.questionId,
      mimeType: format.mime,
      bytes: input.buffer.length,
      durationSec: typeof input.durationSec === 'number' ? Math.min(MAX_RECORDING_SECONDS, Math.max(0, Math.round(input.durationSec))) : null,
      storagePath,
      expiresAt,
    });
    return view(record);
  }

  async list(userId: string, sessionId: string): Promise<RecordingView[]> {
    await this.purgeExpired();
    const session = await this.ownedSession(userId, sessionId);
    const records = await VoiceRecording.find({ userId, sessionId: session._id }).sort({ createdAt: 1 });
    return records.map(view);
  }

  /** The file for streaming to its owner. */
  async file(userId: string, sessionId: string, questionId: string): Promise<{ path: string; mimeType: string; bytes: number }> {
    await this.purgeExpired();
    const session = await this.ownedSession(userId, sessionId);
    const record = await VoiceRecording.findOne({ userId, sessionId: session._id, questionId });
    if (!record || !fs.existsSync(record.storagePath)) throw new AppError('Recording not found.', 404, 'RECORDING_NOT_FOUND');
    return { path: record.storagePath, mimeType: record.mimeType, bytes: record.bytes };
  }

  async remove(userId: string, sessionId: string, questionId: string): Promise<void> {
    const session = await this.ownedSession(userId, sessionId);
    const record = await VoiceRecording.findOne({ userId, sessionId: session._id, questionId });
    if (!record) throw new AppError('Recording not found.', 404, 'RECORDING_NOT_FOUND');
    await removeFiles([record]);
  }

  async removeAllForUser(userId: string): Promise<number> {
    const records = await VoiceRecording.find({ userId });
    await removeFiles(records);
    return records.length;
  }

  /** A shorter retention also shortens recordings already kept; a longer one never extends them. */
  async applyRetention(userId: string, retentionDays: number): Promise<void> {
    const records = await VoiceRecording.find({ userId });
    for (const r of records) {
      const limit = new Date(r.createdAt.getTime() + (retentionDays === 0 ? SAME_DAY_MS : retentionDays * DAY_MS));
      if (limit < r.expiresAt) await VoiceRecording.updateOne({ _id: r._id }, { expiresAt: limit });
    }
    await this.purgeExpired();
  }

  /** Retention 0: recordings go when the round ends. */
  async onSessionCompleted(userId: string, sessionId: string): Promise<void> {
    const settings = await VoiceSettingsService.get(userId);
    if (settings.retentionDays !== 0) return;
    const records = await VoiceRecording.find({ userId, sessionId });
    await removeFiles(records);
  }
}

export default new VoiceRecordingService();
