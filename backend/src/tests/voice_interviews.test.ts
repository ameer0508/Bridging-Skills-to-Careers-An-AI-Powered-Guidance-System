import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * D2 speech-to-text support on the server: consent defaults to none, every change is audited,
 * invalid choices are refused, settings are per user, and each answer records whether it was
 * typed, dictated or both. (Recognition itself happens in the browser; see e2e/tests/interviews.mjs.)
 */

export async function runVoiceInterviewTests() {
  console.log('🧪 Running Voice Interview (D2) Tests...');
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
  } finally {
    await h.close();
  }
  console.log('✅ Voice Interview (D2) Tests Passed\n');
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
