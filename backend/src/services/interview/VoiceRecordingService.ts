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
 *   Expired recordings are purged whenever recordings are touched, by the daily retention job the
 *   server runs (voiceRetentionSchedule.ts) and by scripts/purgeVoiceRecordings.ts; withdrawing
 *   consent deletes all of the user's recordings.
 * - A recording whose file cannot be deleted is never forgotten: it becomes inaccessible at once
 *   and its record is kept, and retried, until the file is gone.
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

export interface DeletionResult {
  /** Recordings whose audio file is gone and whose record was removed. */
  removed: number;
  /** Recordings that are no longer accessible but whose file could not be removed yet. */
  pending: number;
}

/** Indirection so tests can make the file system fail. */
export const recordingFs = {
  rm: (file: string) => fs.promises.rm(file, { force: true }),
};

/**
 * Deletes recordings. Each one is first marked as deletion-requested, which makes it
 * inaccessible at once. Its record is removed only after the audio file is confirmed gone. If
 * the file cannot be removed the record stays, with the attempt counted, and is retried by every
 * later purge. Removing a file that is already absent succeeds, so retries are idempotent.
 */
async function removeFiles(records: IVoiceRecording[]): Promise<DeletionResult> {
  const result: DeletionResult = { removed: 0, pending: 0 };
  if (records.length === 0) return result;
  const now = new Date();
  await VoiceRecording.updateMany({ _id: { $in: records.map(r => r._id) }, deleteRequestedAt: null }, { $set: { deleteRequestedAt: now } });
  for (const r of records) {
    try {
      await recordingFs.rm(r.storagePath);
      await VoiceRecording.deleteOne({ _id: r._id });
      result.removed++;
    } catch (error) {
      // Logged by record id and error code only: no path and no user content
      const code = (error as { code?: string }).code || 'UNKNOWN';
      await VoiceRecording.updateOne({ _id: r._id }, { $inc: { deleteAttempts: 1 }, $set: { lastDeleteError: code } });
      logger.error(`Voice recording ${r._id.toString()} could not be removed (${code}); it stays scheduled for deletion.`);
      result.pending++;
    }
  }
  return result;
}

/** What a user-facing response may say about a deletion that is not finished. */
export const PENDING_DELETION_MESSAGE =
  'The recording can no longer be played or listed. Its file could not be removed from storage yet and will be removed automatically.';

class VoiceRecordingService {
  private async ownedSession(userId: string, sessionId: string) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) throw new AppError('Interview session not found or access denied', 404, 'INTERVIEW_NOT_FOUND');
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) throw new AppError('Interview session not found or access denied', 404, 'INTERVIEW_NOT_FOUND');
    return session;
  }

  /**
   * Deletes every recording past its expiry and retries every deletion that failed earlier.
   * Returns how many were removed and how many are still waiting.
   */
  async purgeExpired(now = new Date()): Promise<DeletionResult> {
    const due = await VoiceRecording.find({ $or: [{ expiresAt: { $lte: now } }, { deleteRequestedAt: { $ne: null } }] });
    return removeFiles(due);
  }

  /** Recordings whose deletion was requested but whose file is still on disk. */
  async pendingDeletions(): Promise<number> {
    return VoiceRecording.countDocuments({ deleteRequestedAt: { $ne: null } });
  }

  /**
   * Removes audio files under the recording directory that no record points to (for example
   * after a crash between writing a file and saving its record). Files changed in the last ten
   * minutes are left alone, as they may belong to an upload in progress.
   */
  async sweepOrphanFiles(now = new Date()): Promise<{ removed: number; failed: number }> {
    const root = recordingRoot();
    const known = new Set((await VoiceRecording.find({}).select('storagePath').lean()).map(r => path.resolve(r.storagePath)));
    const result = { removed: 0, failed: 0 };
    const walk = async (dir: string): Promise<void> => {
      let entries: fs.Dirent[];
      try {
        entries = await fs.promises.readdir(dir, { withFileTypes: true });
      } catch {
        return; // nothing recorded yet
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
          continue;
        }
        if (!entry.isFile() || known.has(path.resolve(full))) continue;
        try {
          const stat = await fs.promises.stat(full);
          if (now.getTime() - stat.mtimeMs < 10 * 60 * 1000) continue;
          await recordingFs.rm(full);
          result.removed++;
        } catch (error) {
          result.failed++;
          logger.error(`An unreferenced voice recording file could not be removed (${(error as { code?: string }).code || 'UNKNOWN'}).`);
        }
      }
    };
    await walk(root);
    return result;
  }

  /** The whole retention job: expiry, retries and unreferenced files. Safe to run at any time. */
  async runRetention(now = new Date()) {
    const purge = await this.purgeExpired(now);
    const orphans = await this.sweepOrphanFiles(now);
    return { removed: purge.removed, pending: purge.pending, orphanFilesRemoved: orphans.removed, orphanFilesFailed: orphans.failed };
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

    // One recording per question. A previous one in another file must really be gone before a
    // new one is accepted; one in the same file is simply overwritten.
    const previous = await VoiceRecording.findOne({ userId, sessionId: session._id, questionId: question.questionId });
    if (previous && path.resolve(previous.storagePath) !== path.resolve(storagePath)) {
      const cleared = await removeFiles([previous]);
      if (cleared.pending > 0) {
        throw new AppError('The earlier recording for this question is still being removed. Try again in a moment.', 503, 'RECORDING_CLEANUP_PENDING');
      }
    }
    await fs.promises.writeFile(storagePath, input.buffer, { mode: 0o600 });
    const fields = {
      mimeType: format.mime,
      bytes: input.buffer.length,
      durationSec: typeof input.durationSec === 'number' ? Math.min(MAX_RECORDING_SECONDS, Math.max(0, Math.round(input.durationSec))) : null,
      storagePath,
      expiresAt,
      deleteRequestedAt: null,
      deleteAttempts: 0,
      lastDeleteError: null,
    };
    try {
      // Same file as before: the existing record now describes the new take, in one atomic update
      // so it is never missing in between. createdAt is set through the driver, because the
      // model's timestamps make it immutable, and retention is counted from it.
      const current = await VoiceRecording.findOne({ userId, sessionId: session._id, questionId: question.questionId });
      if (current) {
        await VoiceRecording.collection.updateOne({ _id: current._id }, { $set: { ...fields, createdAt: now, updatedAt: now } });
        return view((await VoiceRecording.findById(current._id))!);
      }
      return view(await VoiceRecording.create({ userId, sessionId: session._id, questionId: question.questionId, ...fields }));
    } catch (error) {
      // No record means nothing would ever delete this file, so it must not stay
      await recordingFs.rm(storagePath).catch(() => undefined);
      throw error;
    }
  }

  async list(userId: string, sessionId: string): Promise<RecordingView[]> {
    await this.purgeExpired();
    const session = await this.ownedSession(userId, sessionId);
    const records = await VoiceRecording.find({ userId, sessionId: session._id, deleteRequestedAt: null }).sort({ createdAt: 1 });
    return records.map(view);
  }

  /** The file for streaming to its owner. */
  async file(userId: string, sessionId: string, questionId: string): Promise<{ path: string; mimeType: string; bytes: number }> {
    await this.purgeExpired();
    const session = await this.ownedSession(userId, sessionId);
    const record = await VoiceRecording.findOne({ userId, sessionId: session._id, questionId, deleteRequestedAt: null });
    if (!record || !fs.existsSync(record.storagePath)) throw new AppError('Recording not found.', 404, 'RECORDING_NOT_FOUND');
    return { path: record.storagePath, mimeType: record.mimeType, bytes: record.bytes };
  }

  async remove(userId: string, sessionId: string, questionId: string): Promise<DeletionResult> {
    const session = await this.ownedSession(userId, sessionId);
    const record = await VoiceRecording.findOne({ userId, sessionId: session._id, questionId, deleteRequestedAt: null });
    if (!record) throw new AppError('Recording not found.', 404, 'RECORDING_NOT_FOUND');
    return removeFiles([record]);
  }

  /** Every recording of one user, including any whose earlier deletion is still pending. */
  async removeAllForUser(userId: string): Promise<DeletionResult> {
    return removeFiles(await VoiceRecording.find({ userId }));
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
