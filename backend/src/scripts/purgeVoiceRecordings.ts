/**
 * Deletes interview recordings past their retention (D1). Expired recordings are also purged
 * whenever recordings are listed, played or uploaded; run this daily (cron or a scheduled task) so
 * that nothing outlives its retention when nobody uses the feature.
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
    const removed = await VoiceRecordingService.purgeExpired();
    console.log(JSON.stringify({ removed, at: new Date().toISOString() }));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
