import VoiceRecordingService from './VoiceRecordingService.js';
import logger from '../../config/logger.js';

/**
 * Runs the voice-recording retention job inside the backend process: once shortly after start
 * and then every VOICE_RETENTION_INTERVAL_HOURS (24 by default). It needs no external scheduler
 * and no paid service, and it runs wherever the backend runs, including Docker Compose.
 *
 * Each run deletes recordings past their retention, retries deletions that failed before and
 * removes audio files no record points to. `scripts/purgeVoiceRecordings.ts` does the same from
 * the command line, for deployments that prefer cron.
 */
const HOUR_MS = 60 * 60 * 1000;

export function retentionIntervalMs(raw: string | undefined = process.env.VOICE_RETENTION_INTERVAL_HOURS): number {
  const hours = Number(raw);
  // At least hourly, at most daily: a recording must never outlive its retention by more than a day
  return (Number.isFinite(hours) && hours >= 1 && hours <= 24 ? hours : 24) * HOUR_MS;
}

export async function runVoiceRetentionOnce(): Promise<void> {
  try {
    const result = await VoiceRecordingService.runRetention();
    const level = result.pending > 0 || result.orphanFilesFailed > 0 ? 'warn' : 'info';
    logger[level](`Voice retention: ${JSON.stringify(result)}`);
  } catch (error) {
    logger.error(`Voice retention run failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Starts the schedule and returns a function that stops it. */
export function startVoiceRetentionSchedule(): () => void {
  const first = setTimeout(() => void runVoiceRetentionOnce(), 30_000);
  const every = setInterval(() => void runVoiceRetentionOnce(), retentionIntervalMs());
  // Never keeps the process alive on its own
  first.unref();
  every.unref();
  return () => {
    clearTimeout(first);
    clearInterval(every);
  };
}
