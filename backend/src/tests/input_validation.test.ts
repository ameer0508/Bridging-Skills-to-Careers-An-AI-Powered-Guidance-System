import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * Malformed requests to every write endpoint (and the id-addressed reads) are answered with a
 * 4xx and an error code. None may surface as a 500, and none may change anything.
 */
export async function runInputValidationTests() {
  console.log('🧪 Running Input Validation Sweep (HTTP)...');
  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();

  try {
    const user = await h.registerUser('validator');
    const token = user.token;
    const unknownId = new mongoose.Types.ObjectId().toString();
    const conversationId: string = (await h.api('POST', '/ai', { token, json: {} })).body.data._id;
    const sessionId: string = (await h.api('POST', '/interviews', { token, json: { questionCount: 2 } })).body.data._id;

    const cases: Array<[method: string, path: string, json: unknown, expected: number[]]> = [
      // Conversations
      ['POST', '/ai', { careerId: 'not-an-id' }, [400]],
      ['POST', '/ai', { title: { $gt: '' } }, [400]],
      ['POST', '/ai', { title: 'x'.repeat(500) }, [400]],
      ['GET', '/ai/not-an-id', undefined, [400, 404]],
      ['PATCH', `/ai/${conversationId}/career`, { careerId: 'not-an-id' }, [400]],
      ['PATCH', `/ai/${conversationId}/career`, {}, [400]],
      ['PATCH', '/ai/not-an-id/career', { careerId: unknownId }, [400, 404]],
      ['POST', `/ai/${conversationId}/messages`, {}, [400]],
      ['POST', `/ai/${conversationId}/messages`, { content: { $ne: null } }, [400]],
      ['POST', '/ai/messages/not-an-id/feedback', { isHelpful: true }, [400, 404]],
      ['POST', `/ai/messages/${unknownId}/feedback`, { isHelpful: true }, [404]],
      ['POST', `/ai/messages/${unknownId}/feedback`, { isHelpful: 'yes' }, [400]],
      ['POST', '/ai/not-an-id/retry', undefined, [404]],
      // Interviews
      ['GET', '/interviews/not-an-id', undefined, [400, 404]],
      ['GET', `/interviews/${unknownId}/report`, undefined, [404]],
      ['POST', '/interviews/not-an-id/respond', { questionIndex: 0, candidateResponse: 'a' }, [400, 404]],
      ['POST', `/interviews/${sessionId}/respond`, {}, [400]],
      ['POST', `/interviews/${sessionId}/respond`, { questionIndex: 'first', candidateResponse: 'a' }, [400]],
      ['POST', `/interviews/${sessionId}/respond`, { questionIndex: 99, candidateResponse: 'a' }, [400]],
      ['POST', `/interviews/${sessionId}/respond`, { questionIndex: -1, candidateResponse: 'a' }, [400]],
      ['POST', `/interviews/${sessionId}/respond`, { questionIndex: 0, candidateResponse: 42 }, [400]],
      ['POST', `/interviews/${sessionId}/respond`, { questionIndex: 0, candidateResponse: 'x'.repeat(20001) }, [400]],
      ['POST', `/interviews/${unknownId}/complete`, undefined, [404]],
      // Recommendations
      ['PATCH', '/recommendations/not-an-id/status', { status: 'completed' }, [400, 404]],
      ['PATCH', `/recommendations/${unknownId}/status`, { status: 'completed' }, [404]],
      ['PATCH', `/recommendations/${unknownId}/status`, { status: 'bogus' }, [400]],
      ['PATCH', `/recommendations/${unknownId}/status`, {}, [400]],
      // Roadmap
      ['GET', '/roadmap/not-an-id', undefined, [400]],
      ['POST', '/roadmap/not-an-id/regenerate', undefined, [400]],
      ['PATCH', `/roadmap/${unknownId}/items/not-an-id/status`, { status: 'completed' }, [400, 404]],
      ['PATCH', `/roadmap/${unknownId}/items/${unknownId}/status`, { status: 'done' }, [400]],
      // Orchestrator
      ['POST', '/orchestrator/execute', { goal: 12345 }, [400]],
      ['POST', '/orchestrator/execute', { goal: 'x'.repeat(5000) }, [400]],
      // Opportunities
      ['POST', '/opportunities/save', [], [400]],
      ['POST', '/opportunities/save', { externalId: { $ne: '' }, title: 'a', company: 'b', applicationUrl: 'https://example.com' }, [400]],
      ['PATCH', '/opportunities/saved/unknown/status', { status: { $ne: '' } }, [400]],
      // Profile and auth
      ['PUT', '/users/me', { targetRole: 12 }, [400]],
      ['PUT', '/users/me', { fullName: { $set: 'x' } }, [400]],
      ['POST', '/auth/logout', {}, [400]],
      ['POST', '/auth/refresh', { refreshToken: 12 }, [400]],
    ];

    const wrong: string[] = [];
    for (const [method, path, json, expected] of cases) {
      const res = await h.api(method, path, { token, json });
      const hasCode = typeof res.body?.error?.code === 'string' && res.body.error.code.length > 0;
      if (!expected.includes(res.status) || !hasCode) {
        wrong.push(`${method} ${path} ${JSON.stringify(json)?.slice(0, 50)} → ${res.status}${hasCode ? '' : ' (no error code)'}`);
      }
    }
    assert.deepEqual(wrong, [], `unexpected responses:\n  ${wrong.join('\n  ')}`);
    console.log(`  ✓ ${cases.length} malformed requests answered with the expected 4xx and an error code`);

    // A body that is not valid JSON is a client error, not a crash
    const malformed = await h.rawRequest('POST', '/interviews', '{"mode": "technical"', token);
    assert.equal(malformed.status, 400, 'malformed JSON');
    assert.ok(!/SyntaxError|at JSON\.parse|node_modules/.test(malformed.text), 'no stack trace or parser internals in the response');
    console.log('  ✓ Malformed JSON is a 400 without internal details');

    // Nothing was created or changed by any of it
    assert.equal((await h.api('GET', '/ai', { token })).body.data.length, 1);
    assert.equal((await h.api('GET', `/ai/${conversationId}`, { token })).body.data.messages.length, 0);
    const session = (await h.api('GET', `/interviews/${sessionId}`, { token })).body.data;
    assert.ok(session.questions.every((q: any) => !q.candidateResponse), 'no answer was stored from an invalid request');
    assert.equal((await h.api('GET', '/opportunities/saved', { token })).body.data.total, 0);
    assert.equal((await h.api('GET', '/users/me', { token })).body.data.fullName, 'validator Tester');
    console.log('  ✓ No invalid request changed stored data');

    console.log('✅ Input Validation Sweep Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runInputValidationTests();
    } catch (err) {
      console.error('❌ Input Validation Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
