import './setupEnv.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import VoiceRecording from '../models/VoiceRecording.js';
import VoiceRecordingService, { recordingFs, recordingRoot } from '../services/interview/VoiceRecordingService.js';
import { retentionIntervalMs } from '../services/interview/voiceRetentionSchedule.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * Voice-recording retention when the file system does not cooperate: a recording whose file
 * cannot be deleted is never forgotten, becomes inaccessible at once, and is retried until gone.
 */

const DAY = 24 * 60 * 60 * 1000;

export async function runVoiceRetentionTests() {
  console.log('🧪 Running Voice Recording Retention Hardening Tests...');
  const previousDir = process.env.VOICE_RECORDING_DIR;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-voice-retention-'));
  process.env.VOICE_RECORDING_DIR = dir;
  await VoiceRecording.deleteMany({});
  const fakeAi = await ensureFakeAiService();
  fakeAi.interview.mode = 'unavailable';
  const h = await startHttpHarness();
  const realRm = recordingFs.rm;
  // Makes deletion fail for files whose path contains one of these fragments
  const failing = new Set<string>();
  recordingFs.rm = async (file: string) => {
    if ([...failing].some(fragment => file.includes(fragment))) {
      const error = new Error(`EPERM: operation not permitted, unlink '${file}'`) as Error & { code?: string };
      error.code = 'EPERM';
      throw error;
    }
    return realRm(file);
  };

  try {
    const alice = await h.registerUser('retention-alice');
    const bob = await h.registerUser('retention-bob');
    const api = (token: string) => (method: string, url: string, json?: unknown) => h.api(method, url, { token, json });
    const A = api(alice.token);
    const B = api(bob.token);
    const webm = (marker: string) => Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.from(`fake-webm-${marker}`)]);
    const upload = (token: string, sessionId: string, marker: string, questionIndex = 0) => {
      const form = new FormData();
      form.append('audio', new Blob([new Uint8Array(webm(marker))], { type: 'audio/webm' }), 'answer.webm');
      form.append('questionIndex', String(questionIndex));
      return h.api('POST', `/interviews/${sessionId}/recordings`, { token, form });
    };
    const setup = async (call: ReturnType<typeof api>, days = 7) => {
      assert.equal((await call('PUT', '/interviews/voice-settings', { recordingConsent: true, retentionDays: days })).status, 200);
      const session = (await call('POST', '/interviews', { targetCareerTitle: 'Data Analyst', questionCount: 3 })).body.data;
      return { id: session._id as string, questionIds: session.questions.map((q: any) => q.questionId) as string[] };
    };
    const filesOnDisk = () => {
      const found: string[] = [];
      const walk = (d: string) => {
        for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
          const full = path.join(d, entry.name);
          if (entry.isDirectory()) walk(full);
          else found.push(full);
        }
      };
      walk(dir);
      return found;
    };
    const visible = async (call: ReturnType<typeof api>, sessionId: string) => (await call('GET', `/interviews/${sessionId}/recordings`)).body.data.recordings.length as number;

    assert.equal(recordingRoot(), path.resolve(dir));
    const round = await setup(A);
    const bobRound = await setup(B);
    assert.equal((await upload(alice.token, round.id, 'a0', 0)).status, 201);
    assert.equal((await upload(alice.token, round.id, 'a1', 1)).status, 201);
    assert.equal((await upload(alice.token, round.id, 'a2', 2)).status, 201);
    assert.equal((await upload(bob.token, bobRound.id, 'b0', 0)).status, 201);
    assert.equal(filesOnDisk().length, 4);
    if (process.platform !== 'win32') assert.equal(fs.statSync(filesOnDisk()[0]).mode & 0o077, 0, 'recordings are readable by the service account only');

    // === A single deletion that the file system refuses =============================================
    const q0 = encodeURIComponent(round.questionIds[0]);
    failing.add(q0);
    const refused = await A('DELETE', `/interviews/${round.id}/recordings/${q0}`);
    assert.equal(refused.status, 202, 'accepted, not finished');
    assert.deepEqual([refused.body.data.deleted, refused.body.data.pendingDeletion], [0, 1]);
    assert.match(refused.body.data.message, /will be removed automatically/);
    const body = JSON.stringify(refused.body);
    assert.ok(!body.includes(dir) && !body.includes('voice') && !/EPERM|unlink/.test(body), 'no storage path or system error reaches the user');
    assert.equal(await VoiceRecording.countDocuments({ userId: alice.userId }), 3, 'the record is kept: the file is still on disk');
    const stuck = await VoiceRecording.findOne({ userId: alice.userId, questionId: round.questionIds[0] });
    assert.ok(stuck!.deleteRequestedAt && stuck!.deleteAttempts === 1 && stuck!.lastDeleteError === 'EPERM');
    assert.equal(filesOnDisk().length, 4);
    // ...but it is gone as far as the user can tell
    assert.equal(await visible(A, round.id), 2);
    assert.equal((await A('GET', `/interviews/${round.id}/recordings/${q0}/audio`)).status, 404, 'a recording awaiting deletion cannot be played');
    assert.equal((await A('DELETE', `/interviews/${round.id}/recordings/${q0}`)).status, 404, 'and is not offered for deletion again');

    // === Retries: counted, idempotent, and successful once the file system allows ====================
    // Listing and playing above already retried it: every touch of recordings runs the purge
    const attemptsSoFar = (await VoiceRecording.findById(stuck!._id))!.deleteAttempts!;
    assert.ok(attemptsSoFar >= 2, 'ordinary use retries a stuck deletion');
    let run = await VoiceRecordingService.purgeExpired();
    assert.deepEqual(run, { removed: 0, pending: 1 });
    assert.equal((await VoiceRecording.findById(stuck!._id))!.deleteAttempts, attemptsSoFar + 1, 'each failed attempt is counted');
    assert.equal(await VoiceRecordingService.pendingDeletions(), 1);
    failing.clear();
    run = await VoiceRecordingService.purgeExpired();
    assert.deepEqual(run, { removed: 1, pending: 0 }, 'the retry removes the file and only then the record');
    assert.equal(await VoiceRecording.countDocuments({ userId: alice.userId }), 2);
    assert.equal(filesOnDisk().length, 3);
    assert.deepEqual(await VoiceRecordingService.purgeExpired(), { removed: 0, pending: 0 }, 'running it again changes nothing');
    console.log('  ✓ Failed deletion: the record survives with its attempts, the recording is inaccessible at once, no path leaks, the retry finishes the job');

    // === A file that is already gone is not an error ===================================================
    const lone = await VoiceRecording.findOne({ userId: alice.userId, questionId: round.questionIds[1] });
    fs.rmSync(lone!.storagePath);
    assert.equal((await A('GET', `/interviews/${round.id}/recordings/${encodeURIComponent(round.questionIds[1])}/audio`)).status, 404, 'a recording without its file cannot be played');
    const gone = await A('DELETE', `/interviews/${round.id}/recordings/${encodeURIComponent(round.questionIds[1])}`);
    assert.deepEqual([gone.status, gone.body.data.deleted, gone.body.data.pendingDeletion], [200, 1, 0], 'deleting when the file is already absent succeeds and clears the record');
    assert.deepEqual(await VoiceRecordingService.removeAllForUser(alice.userId), { removed: 1, pending: 0 });
    assert.equal(await VoiceRecording.countDocuments({ userId: alice.userId }), 0);

    // === Withdrawing consent with a partial failure ====================================================
    assert.equal((await upload(alice.token, round.id, 'c0', 0)).status, 201);
    assert.equal((await upload(alice.token, round.id, 'c1', 1)).status, 201);
    assert.equal((await upload(alice.token, round.id, 'c2', 2)).status, 201);
    failing.add(encodeURIComponent(round.questionIds[1]));
    const withdrawn = await A('PUT', '/interviews/voice-settings', { recordingConsent: false });
    assert.equal(withdrawn.status, 200);
    assert.deepEqual([withdrawn.body.data.recordingConsent, withdrawn.body.data.recordingsDeleted, withdrawn.body.data.recordingsPendingDeletion], [false, 2, 1], 'two files removed, one still scheduled');
    assert.match(withdrawn.body.data.message, /will be removed automatically/);
    assert.equal(await visible(A, round.id), 0, 'none of them is accessible after consent is withdrawn');
    assert.equal(await VoiceRecording.countDocuments({ userId: alice.userId, deleteRequestedAt: { $ne: null } }), 1);
    assert.equal((await upload(alice.token, round.id, 'no-consent', 0)).status, 403, 'and nothing new can be recorded');
    assert.equal(await visible(B, bobRound.id), 1, "another user's recording is untouched");
    assert.equal(filesOnDisk().length, 2, "alice's stuck file and bob's recording");

    // Deleting everything again while one is stuck reports it, and never touches bob
    const again = await A('DELETE', '/interviews/recordings');
    assert.equal(again.status, 202);
    assert.deepEqual([again.body.data.deleted, again.body.data.pendingDeletion], [0, 1]);
    failing.clear();
    assert.deepEqual(await VoiceRecordingService.runRetention(), { removed: 1, pending: 0, orphanFilesRemoved: 0, orphanFilesFailed: 0 });
    assert.equal(await VoiceRecording.countDocuments({ userId: alice.userId }), 0);
    assert.equal(await VoiceRecording.countDocuments({ userId: bob.userId }), 1);
    console.log('  ✓ Consent withdrawal: every recording inaccessible immediately; the one whose file resisted stays scheduled and is removed by the next run; other users unaffected');

    // === Expiry with a failure, then success ============================================================
    await A('PUT', '/interviews/voice-settings', { recordingConsent: true, retentionDays: 7 });
    assert.equal((await upload(alice.token, round.id, 'e0', 0)).status, 201);
    assert.equal((await upload(alice.token, round.id, 'e1', 1)).status, 201);
    await VoiceRecording.updateMany({ userId: alice.userId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    failing.add(encodeURIComponent(round.questionIds[0]));
    assert.deepEqual(await VoiceRecordingService.purgeExpired(), { removed: 1, pending: 1 }, 'one expired recording removed, the other kept for retry');
    assert.equal(await visible(A, round.id), 0, 'an expired recording is never served, even while its file is still there');
    // Recording the same question again while the old file is stuck in the same place overwrites it
    assert.equal((await upload(alice.token, round.id, 'e0-new', 0)).status, 201);
    const renewed = await VoiceRecording.findOne({ userId: alice.userId, questionId: round.questionIds[0] });
    assert.ok(renewed && !renewed.deleteRequestedAt && renewed.expiresAt.getTime() > Date.now(), 'a new consented recording replaces the stuck one, with a fresh expiry');
    assert.equal(await VoiceRecording.countDocuments({ userId: alice.userId }), 1);
    failing.clear();

    // === Files nobody knows about ========================================================================
    const orphan = path.join(dir, String(alice.userId), 'orphan.webm');
    fs.writeFileSync(orphan, webm('orphan'));
    const fresh = path.join(dir, String(alice.userId), 'in-flight.webm');
    fs.writeFileSync(fresh, webm('fresh'));
    const old = new Date(Date.now() - 60 * 60 * 1000);
    fs.utimesSync(orphan, old, old);
    const swept = await VoiceRecordingService.runRetention();
    assert.deepEqual([swept.orphanFilesRemoved, swept.orphanFilesFailed], [1, 0]);
    assert.ok(!fs.existsSync(orphan) && fs.existsSync(fresh), 'an old unreferenced file is removed; a file written a moment ago is left alone');
    assert.ok(fs.existsSync(renewed!.storagePath) && (await visible(B, bobRound.id)) === 1, 'files that have a record are never swept');
    fs.rmSync(fresh);

    // === Schedule ============================================================================================
    assert.equal(retentionIntervalMs(undefined), DAY, 'daily by default');
    assert.equal(retentionIntervalMs('6'), 6 * 60 * 60 * 1000);
    for (const bad of ['0', '48', 'often', '']) assert.equal(retentionIntervalMs(bad), DAY, `"${bad}" falls back to daily, never to less often`);
    console.log('  ✓ Expiry and housekeeping: expired recordings are never served; stuck files are retried; unreferenced files are swept; the job runs at least daily');

    console.log('✅ Voice Recording Retention Hardening Tests Passed\n');
  } finally {
    recordingFs.rm = realRm;
    await h.close();
    await VoiceRecording.deleteMany({});
    fs.rmSync(dir, { recursive: true, force: true });
    if (previousDir === undefined) delete process.env.VOICE_RECORDING_DIR;
    else process.env.VOICE_RECORDING_DIR = previousDir;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runVoiceRetentionTests();
    } catch (err) {
      console.error('❌ Voice Retention Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
