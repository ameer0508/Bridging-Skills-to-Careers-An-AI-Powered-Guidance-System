import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import { buildChatPrompt } from '../services/ConversationService.js';
import { ConversationMessage } from '../models/ConversationMessage.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * Chat under limited local-model capacity: a busy model gives a labelled "busy" fallback and
 * nothing invented; one reply at a time per user; and when history must be shortened to fit the
 * model's context, only the oldest history goes, the instructions, the user's own context and the
 * latest message always stay, and the trimming is recorded on the reply.
 */
export async function runChatCapacityTests() {
  console.log('🧪 Running Chat Capacity and Context Tests...');

  // --- Prompt building (no HTTP) ---------------------------------------------------------------
  const context = { userDomain: { targetRole: 'Backend Developer' }, marker: 'CONTEXT-MARKER-ALICE' };
  const history = [
    { role: 'user', content: 'Q1 ' + 'a'.repeat(900) },
    { role: 'assistant', content: 'A1 ' + 'b'.repeat(900) },
    { role: 'user', content: 'Q2 ' + 'c'.repeat(900) },
    { role: 'assistant', content: 'A2 ' + 'd'.repeat(900) },
    { role: 'user', content: 'LATEST-QUESTION what next?' },
  ];
  const whole = buildChatPrompt(context, history, 100_000);
  assert.equal(whole.droppedMessages, 0);
  assert.equal(whole.keptMessages, 5);

  const limit = whole.prompt.length - 1000; // room for all but the two oldest messages
  const trimmed = buildChatPrompt(context, history, limit);
  assert.ok(trimmed.prompt.length <= limit, `prompt ${trimmed.prompt.length} over ${limit}`);
  assert.equal(trimmed.droppedMessages, 2, 'the two oldest messages go first');
  assert.ok(!trimmed.prompt.includes('Q1 ') && !trimmed.prompt.includes('A1 '), 'the oldest exchange should be gone');
  assert.ok(trimmed.prompt.includes('Q2 ') && trimmed.prompt.includes('A2 '), 'newer history stays');
  for (const kept of ['STRICT INSTRUCTIONS', 'CONTEXT-MARKER-ALICE', 'LATEST-QUESTION what next?']) {
    assert.ok(trimmed.prompt.includes(kept), `${kept} must always be kept`);
  }

  const tiny = buildChatPrompt(context, history, 10);
  assert.equal(tiny.keptMessages, 1, 'the latest message is never dropped');
  assert.ok(tiny.prompt.includes('STRICT INSTRUCTIONS') && tiny.prompt.includes('CONTEXT-MARKER-ALICE') && tiny.prompt.includes('LATEST-QUESTION'),
    'when even the essentials exceed the limit they are sent whole, for the AI service to refuse');
  console.log('  ✓ Trimming drops the oldest history only; instructions, context and the latest message stay');

  // --- Over HTTP ---------------------------------------------------------------------------------
  const fakeAi = await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();
  const originalLimit = process.env.CHAT_PROMPT_MAX_CHARS;
  try {
    const alice = await h.registerUser('capacity-alice');
    const bob = await h.registerUser('capacity-bob');
    const newConversation = async (token: string) => (await h.api('POST', '/ai', { token, json: {} })).body.data._id as string;

    // Busy: an explicit, labelled fallback; no provider claimed, nothing invented
    const convA = await newConversation(alice.token);
    fakeAi.chat.mode = 'busy';
    const busy = await h.api('POST', `/ai/${convA}/messages`, { token: alice.token, json: { content: 'What next?' } });
    assert.equal(busy.status, 200);
    assert.equal(busy.body.data.source, 'fallback');
    assert.equal(busy.body.data.fallbackReason, 'busy');
    assert.equal(busy.body.data.aiProvider, undefined);
    assert.match(busy.body.data.content, /busy with other requests/);
    assert.match(busy.body.data.content, /not an AI-generated answer/);
    fakeAi.chat.mode = 'ok';
    fakeAi.chat.reply = 'A real reply after the model was free.';
    const retried = await h.api('POST', `/ai/${convA}/retry`, { token: alice.token });
    assert.equal(retried.status, 200);
    assert.equal(retried.body.data.source, 'ai');
    console.log('  ✓ A busy model gives a labelled "busy" fallback that can be retried');

    // One reply at a time per user; other users are not held up
    fakeAi.chat.mode = 'slow';
    fakeAi.chat.delayMs = 1500;
    const convA2 = await newConversation(alice.token);
    const convB = await newConversation(bob.token);
    const before = await ConversationMessage.countDocuments({ conversationId: new mongoose.Types.ObjectId(convA2) });
    // The second and third requests start while the first reply is still being written
    const later = <T>(ms: number, fn: () => Promise<T>) => new Promise(r => setTimeout(r, ms)).then(fn);
    const [first, second, other] = await Promise.all([
      h.api('POST', `/ai/${convA2}/messages`, { token: alice.token, json: { content: 'First question' } }),
      later(200, () => h.api('POST', `/ai/${convA2}/messages`, { token: alice.token, json: { content: 'Second question' } })),
      later(200, () => h.api('POST', `/ai/${convB}/messages`, { token: bob.token, json: { content: 'Bob asks' } })),
    ]);
    assert.equal(first.status, 200);
    assert.equal(second.status, 409);
    assert.equal(second.body.error.code, 'REPLY_IN_PROGRESS');
    assert.equal(other.status, 200, "another user's reply is not blocked");
    const stored = await ConversationMessage.find({ conversationId: new mongoose.Types.ObjectId(convA2) }).lean();
    assert.equal(stored.length - before, 2, 'the refused message was not stored');
    assert.ok(!stored.some(m => m.content === 'Second question'));
    const afterward = await h.api('POST', `/ai/${convA2}/messages`, { token: alice.token, json: { content: 'Second question' } });
    assert.equal(afterward.status, 200, 'the same user can send again once the reply is written');
    console.log('  ✓ One reply at a time per user (409, nothing stored); other users are not held up');

    // Trimming over HTTP: recorded on the reply, latest message and context present in the prompt
    fakeAi.chat.mode = 'ok';
    fakeAi.chat.reply = 'Short reply.';
    process.env.CHAT_PROMPT_MAX_CHARS = '5000';
    const convT = await newConversation(alice.token);
    for (let i = 1; i <= 4; i++) {
      const res = await h.api('POST', `/ai/${convT}/messages`, { token: alice.token, json: { content: `Long question ${i}: ${'x'.repeat(1500)}` } });
      assert.equal(res.status, 200);
    }
    const final = await h.api('POST', `/ai/${convT}/messages`, { token: alice.token, json: { content: 'FINAL-QUESTION please summarise' } });
    const sent = fakeAi.chat.prompts[fakeAi.chat.prompts.length - 1];
    assert.ok(sent.includes('FINAL-QUESTION please summarise') && sent.includes('STRICT INSTRUCTIONS'), 'latest message or instructions missing');
    assert.ok(!sent.includes('Long question 1:'), 'the oldest question should have been left out');
    assert.ok(sent.length <= 5000, `prompt ${sent.length} over the limit`);
    assert.ok(final.body.data.contextTrimmed?.droppedMessages > 0, 'the trimming is not recorded on the reply');
    const history2 = (await h.api('GET', `/ai/${convT}`, { token: alice.token })).body.data.messages;
    assert.equal(history2.filter((m: any) => m.role === 'user').length, 5, 'trimming the prompt removed nothing from the stored conversation');
    console.log('  ✓ Trimming is recorded on the reply and leaves the stored conversation intact');

    console.log('✅ Chat Capacity and Context Tests Passed\n');
  } finally {
    if (originalLimit === undefined) delete process.env.CHAT_PROMPT_MAX_CHARS;
    else process.env.CHAT_PROMPT_MAX_CHARS = originalLimit;
    fakeAi.chat.mode = 'ok';
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runChatCapacityTests();
    } catch (err) {
      console.error('❌ Chat Capacity Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
