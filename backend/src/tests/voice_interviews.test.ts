import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * D1 recorded answers and D2 speech-to-text support on the server: consent defaults to none, every change is audited,
 * invalid choices are refused, settings are per user, and each answer records whether it was
 * typed, dictated or both. (Recognition itself happens in the browser; see e2e/tests/interviews.mjs.)
 */

export async function runVoiceInterviewTests() {
  console.log('🧪 Running Voice Interview (D1, D2) Tests...');
  const fakeAi = await ensureFakeAiService();
  fakeAi.interview.mode = 'unavailable';

  const h = await startHttpHarness();
  try {
    assert.equal((await h.api('GET', '/interviews/voice-settings')).status, 401);
    const alice = await h.registerUser('voice-alice');
    const bob = await h.registerUser('voice-bob');
    const A = (method: string, path: string, json?: unknown) => h.api(method, path, { token: alice.token, json });

    // === Consent ===================================================================================
    const initial = (await A('GET', '/interviews/voice-settings')).body.data;
    assert.deepEqual([initial.dictationConsent, initial.recordingConsent, initial.retentionDays, initial.history.length], ['none', false, 0, 0], 'nothing is allowed by default');

    let r = await A('PUT', '/interviews/voice-settings', { dictationConsent: 'browser_service' });
    assert.equal(r.status, 200);
    assert.equal(r.body.data.dictationConsent, 'browser_service');
    assert.equal(r.body.data.history.length, 1);
    r = await A('PUT', '/interviews/voice-settings', { dictationConsent: 'browser_service' });
    assert.equal(r.body.data.history.length, 1, 'repeating the same choice adds no history');
    r = await A('PUT', '/interviews/voice-settings', { dictationConsent: 'none' });
    assert.deepEqual(r.body.data.history.map((x: { field: string; value: string }) => `${x.field}=${x.value}`), ['dictationConsent=browser_service', 'dictationConsent=none']);

    for (const [label, body] of [
      ['unknown consent', { dictationConsent: 'always' }],
      ['retention not offered', { retentionDays: 5 }],
      ['recording as text', { recordingConsent: 'yes' }],
      ['empty', {}],
      ['unknown field', { shareWithEmployers: true }],
    ] as const) {
      assert.equal((await A('PUT', '/interviews/voice-settings', body)).status, 400, label);
    }
    assert.equal((await h.api('GET', '/interviews/voice-settings', { token: bob.token })).body.data.dictationConsent, 'none', "alice's choices are not bob's");
    console.log('  ✓ Consent: none by default, changes audited once each, 5 invalid updates refused, per user');

    // === Input method on answers ===================================================================
    const started = await A('POST', '/interviews', { targetCareerTitle: 'Data Analyst', questionCount: 3 });
    const id = started.body.data._id;
    const answer = 'I would compare the two groups with an A/B test and look at the conversion rate over two weeks, because that is the decision metric.';
    r = await A('POST', `/interviews/${id}/respond`, { questionIndex: 0, candidateResponse: answer, inputMethod: 'dictated' });
    assert.equal(r.body.data.questions[0].answerInputMethod, 'dictated');
    r = await A('POST', `/interviews/${id}/respond`, { questionIndex: 1, candidateResponse: answer });
    assert.equal(r.body.data.questions[1].answerInputMethod, 'typed', 'typed unless the client says otherwise');
    assert.equal((await A('POST', `/interviews/${id}/respond`, { questionIndex: 2, candidateResponse: answer, inputMethod: 'shouted' })).status, 400);
    assert.ok(!JSON.stringify(r.body).includes('audio'), 'no audio is stored with an answer');
    console.log('  ✓ Answers record typed, dictated or mixed input; the text is what is stored and scored');

    // === D1 recordings =============================================================================
    const webm = (marker: string) => Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.from(`fake-webm-${marker}`)]);
    const upload = (token: string, sessionId: string, body: { buffer?: Buffer; type?: string; questionIndex?: string; name?: string }) => {
      const form = new FormData();
      if (body.buffer) form.append('audio', new Blob([body.buffer], { type: body.type ?? 'audio/webm' }), body.name ?? 'answer.webm');
      form.append('questionIndex', body.questionIndex ?? '0');
      form.append('durationSec', '12.4');
      return h.api('POST', `/interviews/${sessionId}/recordings`, { token, form });
    };
    const B = (method: string, path: string, json?: unknown) => h.api(method, path, { token: bob.token, json });
    const round = (await A('POST', '/interviews', { targetCareerTitle: 'Data Analyst', questionCount: 2 })).body.data._id;

    r = await upload(alice.token, round, { buffer: webm('1') });
    assert.deepEqual([r.status, r.body.error?.code], [403, 'RECORDING_CONSENT_REQUIRED'], 'no recording without consent');

    r = await A('PUT', '/interviews/voice-settings', { recordingConsent: true, retentionDays: 7 });
    assert.deepEqual([r.body.data.recordingConsent, r.body.data.retentionDays], [true, 7]);
    r = await upload(alice.token, round, { buffer: webm('1') });
    assert.equal(r.status, 201);
    assert.deepEqual([r.body.data.mimeType, r.body.data.durationSec], ['audio/webm', 12]);
    const days = (Date.parse(r.body.data.expiresAt) - Date.now()) / 86_400_000;
    assert.ok(days > 6.9 && days <= 7, `kept for 7 days (${days.toFixed(2)})`);
    assert.ok(!JSON.stringify(r.body).includes('storagePath') && !JSON.stringify(r.body).includes('voice-recordings'), 'the storage location is never returned');

    // Played back to its owner only, byte for byte
    const audio = await fetch(`${h.origin}/api/v1/interviews/${round}/recordings/${encodeURIComponent((await A('GET', `/interviews/${round}`)).body.data.questions[0].questionId)}/audio`, { headers: { Authorization: `Bearer ${alice.token}` } });
    assert.equal(audio.status, 200);
    assert.equal(audio.headers.get('content-type'), 'audio/webm');
    assert.match(audio.headers.get('cache-control') ?? '', /no-store/);
    assert.deepEqual(Buffer.from(await audio.arrayBuffer()), webm('1'));

    // Content checks
    for (const [label, body] of [
      ['text dressed as audio', { buffer: Buffer.from('not audio at all'), type: 'audio/webm' }],
      ['an image', { buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]), type: 'image/png', name: 'x.png' }],
      ['too large', { buffer: Buffer.concat([webm('big'), Buffer.alloc(5 * 1024 * 1024)]) }],
      ['no file', {}],
      ['question out of range', { buffer: webm('2'), questionIndex: '99' }],
      ['index not a number', { buffer: webm('2'), questionIndex: 'first' }],
    ] as const) {
      assert.equal((await upload(alice.token, round, body as never)).status, 400, label);
    }

    // Re-recording replaces; isolation
    await upload(alice.token, round, { buffer: webm('again') });
    let list = (await A('GET', `/interviews/${round}/recordings`)).body.data.recordings;
    assert.equal(list.length, 1, 'one recording per question');
    await B('PUT', '/interviews/voice-settings', { recordingConsent: true });
    const qid = encodeURIComponent(list[0].questionId);
    for (const [label, status] of [
      ['list', (await B('GET', `/interviews/${round}/recordings`)).status],
      ['play', (await B('GET', `/interviews/${round}/recordings/${qid}/audio`)).status],
      ['delete', (await B('DELETE', `/interviews/${round}/recordings/${qid}`)).status],
      ['upload', (await upload(bob.token, round, { buffer: webm('bob') })).status],
    ] as const) {
      assert.equal(status, 404, `bob: ${label}`);
    }
    assert.equal((await A('GET', `/interviews/${round}/recordings`)).body.data.recordings.length, 1, "bob's attempts changed nothing");

    // Delete one
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { recordingRoot } = await import('../services/interview/VoiceRecordingService.js');
    const sessionDir = path.join(recordingRoot(), alice.userId, round);
    assert.equal(fs.readdirSync(sessionDir).length, 1);
    assert.equal((await A('DELETE', `/interviews/${round}/recordings/${qid}`)).status, 200);
    assert.equal(fs.readdirSync(sessionDir).length, 0, 'the file is removed from disk');
    assert.equal((await A('GET', `/interviews/${round}/recordings/${qid}/audio`)).status, 404);
    console.log('  ✓ Recordings: consent required, 7-day expiry, owner-only playback, 6 bad uploads refused, replace, 4 isolation probes, delete removes the file');

    // Retention 0: shortened, then deleted when the round ends
    await upload(alice.token, round, { buffer: webm('3') });
    r = await A('PUT', '/interviews/voice-settings', { retentionDays: 0 });
    list = (await A('GET', `/interviews/${round}/recordings`)).body.data.recordings;
    assert.ok(Date.parse(list[0].expiresAt) - Date.now() <= 86_400_000, 'a shorter retention shortens kept recordings');
    await A('POST', `/interviews/${round}/complete`);
    assert.equal((await A('GET', `/interviews/${round}/recordings`)).body.data.recordings.length, 0, 'retention 0: deleted when the round ends');
    assert.equal((await upload(alice.token, round, { buffer: webm('late') })).status, 409, 'no recording after the round');

    // Expiry purge, and withdrawing consent
    const { default: VoiceRecording } = await import('../models/VoiceRecording.js');
    await A('PUT', '/interviews/voice-settings', { retentionDays: 30 });
    const round2 = (await A('POST', '/interviews', { targetCareerTitle: 'Data Analyst', questionCount: 2 })).body.data._id;
    await upload(alice.token, round2, { buffer: webm('a') });
    await upload(alice.token, round2, { buffer: webm('b'), questionIndex: '1' });
    await VoiceRecording.updateOne({ sessionId: round2, questionId: { $exists: true } }, { expiresAt: new Date(Date.now() - 1000) });
    assert.equal((await A('GET', `/interviews/${round2}/recordings`)).body.data.recordings.length, 1, 'an expired recording is purged on access');
    r = await A('PUT', '/interviews/voice-settings', { recordingConsent: false });
    assert.equal(r.body.data.recordingsDeleted, 1, 'withdrawing consent deletes every recording');
    assert.equal(await VoiceRecording.countDocuments({ userId: alice.userId }), 0);
    assert.equal(fs.readdirSync(path.join(recordingRoot(), alice.userId, round2)).length, 0);
    assert.deepEqual(r.body.data.history.slice(-1)[0], { ...r.body.data.history.slice(-1)[0], field: 'recordingConsent', value: 'false' });
    console.log('  ✓ Retention: shortening applies to kept recordings, 0 deletes at round end, expiry purged, withdrawal deletes everything');
  } finally {
    await h.close();
  }
  console.log('✅ Voice Interview (D1, D2) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runVoiceInterviewTests();
    } catch (err) {
      console.error('❌ Voice Interview Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
      process.exit();
    }
  })();
}
