import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import { buildFallbackReply } from '../services/ConversationService.js';
import { chatAiTimeoutMs } from '../services/AIClientService.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * AI chat over HTTP: replies are labelled with their real source, an unavailable or slow
 * provider yields a clearly marked fallback (never an invented answer), a failed reply can be
 * retried without duplicating the question, and conversations are private and persistent.
 */

const RESUME = [
  'Sam Candidate',
  'Email: sam.candidate@example.com',
  '',
  'Experience:',
  'Frontend Developer at Example Co (2022-2024)',
  'Built dashboards with React, JavaScript, HTML and CSS.',
  '',
  'Skills:',
  'React, JavaScript, HTML, CSS, Node.js, Git'
].join('\n');

async function uploadAndWait(h: HttpHarness, token: string) {
  assert.equal((await h.api('POST', '/resumes/upload', { token, form: resumeForm(RESUME) })).status, 201);
  for (let i = 0; i < 100; i++) {
    if ((await h.api('GET', '/resumes/me', { token })).body.data.resume?.parsingStatus === 'completed') return;
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}

export async function runChatReliabilityTests() {
  console.log('🧪 Running AI Chat Reliability Tests (HTTP)...');
  const fakeAi = await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();
  const originalTimeout = process.env.CHAT_AI_TIMEOUT_MS;

  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');
    await uploadAndWait(h, alice.token);

    // The timeout chain is ordered: local model < backend < nginx < browser
    delete process.env.CHAT_AI_TIMEOUT_MS;
    assert.equal(chatAiTimeoutMs(), 130000);
    assert.ok(120000 < chatAiTimeoutMs() && chatAiTimeoutMs() < 150000, 'local model 120s < backend 130s < nginx 150s < browser 160s');

    const created = await h.api('POST', '/ai', { token: alice.token, json: {} });
    assert.equal(created.status, 201);
    const convId: string = created.body.data._id;
    const messagesUrl = `/ai/${convId}/messages`;
    const history = async (token = alice.token) => (await h.api('GET', `/ai/${convId}`, { token })).body.data.messages as any[];

    // --- A real reply is labelled with the provider that wrote it ------------------------------
    fakeAi.chat.mode = 'ok';
    fakeAi.chat.reply = 'Focus on Docker next; your React evidence is already strong.';
    const first = await h.api('POST', messagesUrl, { token: alice.token, json: { content: 'What should I learn next?' } });
    assert.equal(first.status, 200);
    assert.equal(first.body.data.role, 'assistant');
    assert.equal(first.body.data.content, fakeAi.chat.reply);
    assert.equal(first.body.data.source, 'ai');
    assert.equal(first.body.data.isFallback, false);
    assert.equal(first.body.data.aiProvider, 'fake_ai_service');
    assert.equal(first.body.data.aiModel, 'fake-chat-model');
    const prompt = fakeAi.chat.prompts.at(-1)!;
    assert.ok(prompt.includes('What should I learn next?'), 'the question reaches the provider');
    assert.ok(/React/.test(prompt), "the prompt is grounded in the user's own skills");
    assert.equal((await h.api('GET', `/ai/${convId}`, { token: alice.token })).body.data.conversation.title, 'What should I learn next?');
    console.log('  ✓ AI reply: stored with source "ai", provider and model; prompt carries the user context');

    // --- Provider unavailable: a labelled fallback, not an invented answer ----------------------
    fakeAi.chat.mode = 'unavailable';
    const started = Date.now();
    const second = await h.api('POST', messagesUrl, { token: alice.token, json: { content: 'How ready am I for interviews?' } });
    assert.equal(second.status, 200, 'an unavailable provider is not a server error');
    assert.ok(Date.now() - started < 3000, 'a "no provider" answer is not retried');
    const fallback = second.body.data;
    assert.equal(fallback.source, 'fallback');
    assert.equal(fallback.isFallback, true);
    assert.equal(fallback.fallbackReason, 'unavailable');
    assert.equal(fallback.aiProvider, undefined, 'no provider or model is claimed for a fallback');
    assert.equal(fallback.aiModel, undefined);
    assert.match(fallback.content, /not an AI-generated answer/);
    assert.match(fallback.content, /Skills on your profile: 6/, 'the fallback only reports stored figures');
    assert.ok(!/Mock AI|high latency|confidence|tokens/i.test(fallback.content));
    let messages = await history();
    assert.deepEqual(messages.map(m => m.role), ['user', 'assistant', 'user', 'assistant']);
    assert.equal(messages[2].content, 'How ready am I for interviews?', 'the question is kept');
    console.log('  ✓ Unavailable provider: immediate, clearly labelled fallback built from stored data');

    // --- Retry replaces the fallback and does not duplicate the question -----------------------
    const stillDown = await h.api('POST', `/ai/${convId}/retry`, { token: alice.token });
    assert.equal(stillDown.status, 200);
    assert.equal(stillDown.body.data.isFallback, true, 'retrying while still unavailable gives a fallback again');
    assert.equal((await history()).length, 4, 'the failed reply is replaced, not appended');

    fakeAi.chat.mode = 'ok';
    fakeAi.chat.reply = 'Your interview practice score suggests working on structure.';
    const retried = await h.api('POST', `/ai/${convId}/retry`, { token: alice.token });
    assert.equal(retried.status, 200);
    assert.equal(retried.body.data.source, 'ai');
    assert.equal(retried.body.data.content, fakeAi.chat.reply);
    messages = await history();
    assert.deepEqual(messages.map(m => [m.role, m.isFallback]), [['user', false], ['assistant', false], ['user', false], ['assistant', false]]);
    assert.equal(messages.filter(m => m.content === 'How ready am I for interviews?').length, 1);
    const retryPrompt = fakeAi.chat.prompts.at(-1)!;
    assert.ok(retryPrompt.includes('How ready am I for interviews?') && retryPrompt.includes('Focus on Docker next'), 'earlier real turns are kept as history');
    assert.ok(!retryPrompt.includes('not an AI-generated answer'), 'fallback notices are never fed to the model as its own words');
    const nothing = await h.api('POST', `/ai/${convId}/retry`, { token: alice.token });
    assert.equal(nothing.status, 409);
    assert.equal(nothing.body.error.code, 'NOTHING_TO_RETRY');
    console.log('  ✓ Retry: replaces the fallback with the real reply, keeps one copy of the question, 409 when nothing failed');

    // --- Slow provider and provider error -----------------------------------------------------------
    process.env.CHAT_AI_TIMEOUT_MS = '400';
    fakeAi.chat.mode = 'slow';
    const slowStarted = Date.now();
    const slow = await h.api('POST', messagesUrl, { token: alice.token, json: { content: 'Slow question' } });
    assert.equal(slow.body.data.isFallback, true);
    assert.equal(slow.body.data.fallbackReason, 'timeout');
    assert.match(slow.body.data.content, /did not respond in time/);
    assert.ok(Date.now() - slowStarted < 1400, 'the backend timeout is enforced and a timeout is not retried');
    delete process.env.CHAT_AI_TIMEOUT_MS;

    fakeAi.chat.mode = 'error';
    const errored = await h.api('POST', messagesUrl, { token: alice.token, json: { content: 'Error question' } });
    assert.equal(errored.status, 200);
    assert.equal(errored.body.data.fallbackReason, 'error');
    assert.ok(!/Internal Server Error|500/.test(errored.body.data.content), 'upstream error text is not shown to the user');
    fakeAi.chat.mode = 'ok';
    console.log('  ✓ Timeout and provider error: labelled fallbacks with the reason, no upstream detail leaked');

    // --- Fallback wording for an empty profile ---------------------------------------------------------
    const emptyFallback = buildFallbackReply({ timestamp: 'now', skills: [] }, 'unavailable');
    assert.match(emptyFallback, /no resume data on your profile yet/i);
    assert.ok(!/\d+\/100|Skills on your profile/.test(emptyFallback), 'nothing is reported that is not stored');

    // --- Validation, persistence and isolation -------------------------------------------------------------
    assert.equal((await h.api('POST', messagesUrl, { token: alice.token, json: { content: '   ' } })).status, 400);
    assert.equal((await h.api('POST', messagesUrl, { token: alice.token, json: { content: 'x'.repeat(4001) } })).status, 400);
    assert.equal((await h.api('POST', messagesUrl, { json: { content: 'hi' } })).status, 401);
    assert.equal((await h.api('POST', '/ai/not-an-id/messages', { token: alice.token, json: { content: 'hi' } })).status, 404);

    const persisted = await history();
    assert.equal(persisted.length, 8, 'every question and reply is stored');
    assert.equal(persisted.filter(m => m.isFallback).length, 2);
    const list = (await h.api('GET', '/ai', { token: alice.token })).body.data;
    assert.equal(list.length, 1);

    for (const [method, path, json] of [
      ['GET', `/ai/${convId}`, undefined],
      ['POST', `/ai/${convId}/messages`, { content: 'intrusion' }],
      ['POST', `/ai/${convId}/retry`, undefined]
    ] as const) {
      const res = await h.api(method, path, { token: bob.token, json });
      assert.equal(res.status, 404, `Bob ${method} ${path}`);
      assert.equal(res.body.error.code, 'CONVERSATION_NOT_FOUND');
    }
    assert.deepEqual((await h.api('GET', '/ai', { token: bob.token })).body.data, []);
    assert.equal((await history()).length, 8, "another user's requests add nothing to Alice's conversation");
    console.log('  ✓ Validation, persistence across requests, and conversations private to their owner');

    console.log('✅ AI Chat Reliability Tests Passed\n');
  } finally {
    fakeAi.chat.mode = 'ok';
    fakeAi.chat.reply = 'Deterministic test reply.';
    if (originalTimeout === undefined) delete process.env.CHAT_AI_TIMEOUT_MS;
    else process.env.CHAT_AI_TIMEOUT_MS = originalTimeout;
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runChatReliabilityTests();
    } catch (err) {
      console.error('❌ Chat Reliability Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
