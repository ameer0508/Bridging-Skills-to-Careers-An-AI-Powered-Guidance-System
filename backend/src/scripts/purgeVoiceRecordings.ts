/**
 * Deletes interview recordings past their retention (D1), retries deletions that failed before
 * and removes audio files no record points to. The backend runs the same job itself every 24
 * hours (voiceRetentionSchedule.ts); this script is for running it on demand or from cron.
 * Exit code 2 means some file could not be removed and is still scheduled.
 *
 *   tsx src/scripts/purgeVoiceRecordings.ts
 *
 * Connects to MONGODB_URI. Prints the number of recordings removed.
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import VoiceRecordingService from '../services/interview/VoiceRecordingService.js';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  try {
    const result = await VoiceRecordingService.runRetention();
    console.log(JSON.stringify({ ...result, at: new Date().toISOString() }));
    // A file that could not be removed is reported through the exit code, so a scheduler notices
    if (result.pending > 0 || result.orphanFilesFailed > 0) process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
