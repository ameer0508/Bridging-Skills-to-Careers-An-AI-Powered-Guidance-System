import './setupEnv.js';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { pathToFileURL } from 'node:url';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import AIClientService from '../services/AIClientService.js';
import CareerService from '../services/CareerService.js';
import { ACTING_USER_HEADER, INTERNAL_KEY_HEADER } from '../services/aiHttp.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Analytics authorization. The dashboard analytics take the user only from the verified access
 * token: no token, a forged or tampered token, or a user id in the query or body never yields
 * another user's analytics. Calls to the AI service's analytics route name the authenticated
 * user as the acting user, so that service can refuse a body user id that is someone else's.
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
  'React, JavaScript, HTML, CSS, Node.js, Git',
].join('\n');

async function uploadAndWait(h: HttpHarness, token: string) {
  assert.equal((await h.api('POST', '/resumes/upload', { token, form: resumeForm(RESUME) })).status, 201);
  for (let i = 0; i < 100; i++) {
    if ((await h.api('GET', '/resumes/me', { token })).body.data.resume?.parsingStatus === 'completed') return;
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}

async function checkAiServiceCallNamesTheActingUser() {
  const seen: Array<{ path: string; headers: http.IncomingHttpHeaders; body: any }> = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', c => (raw += c));
    req.on('end', () => {
      seen.push({ path: req.url || '', headers: req.headers, body: raw ? JSON.parse(raw) : null });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, provider: 'stand-in', data: {} }));
    });
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const original = process.env.AI_SERVICE_URL;
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const userId = '64b000000000000000000001';
    await AIClientService.generateAnalytics(userId, []);
    const call = seen.find(s => s.path === '/api/v1/analytics/insights');
    assert.ok(call, 'analytics request sent');
    assert.equal(call.body.user_id, userId);
    assert.equal(call.headers[ACTING_USER_HEADER.toLowerCase()], userId, 'acting user equals the body user');
    assert.ok(call.headers[INTERNAL_KEY_HEADER.toLowerCase()], 'service key still sent');
  } finally {
    if (original === undefined) delete process.env.AI_SERVICE_URL;
    else process.env.AI_SERVICE_URL = original;
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

export async function runAnalyticsAuthorizationTests() {
  console.log('🧪 Running Analytics Authorization Tests (HTTP)...');

  await checkAiServiceCallNamesTheActingUser();
  console.log('  ✓ AI-service analytics calls name the body user as the acting user and keep the service key');

  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();
  try {
    const alice = await h.registerUser('analytics-alice');
    const bob = await h.registerUser('analytics-bob');
    await uploadAndWait(h, alice.token);

    // Authorized: each user gets their own analytics
    const own = await h.api('GET', '/analytics?period=monthly', { token: alice.token });
    assert.equal(own.status, 200);
    const aliceSkills = own.body.data.currentMetrics.totalSkills;
    assert.ok(aliceSkills > 0, `alice's analytics count her skills (${aliceSkills})`);
    const bobs = await h.api('GET', '/analytics?period=monthly', { token: bob.token });
    assert.equal(bobs.status, 200);
    assert.equal(bobs.body.data.currentMetrics.totalSkills, 0, "bob's analytics hold none of alice's skills");
    console.log('  ✓ Each signed-in user receives only their own analytics');

    // Missing identity
    assert.equal((await h.api('GET', '/analytics')).status, 401);

    // Forged identity: a token for alice signed with another key, a tampered payload, an unsigned token
    const forged = jwt.sign({ userId: alice.userId, role: 'user' }, 'not-the-server-secret', { expiresIn: '15m' });
    assert.equal((await h.api('GET', '/analytics', { token: forged })).status, 401);
    const [header, , signature] = bob.token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ userId: alice.userId, role: 'user', exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url');
    assert.equal((await h.api('GET', '/analytics', { token: `${header}.${tamperedPayload}.${signature}` })).status, 401);
    const unsigned = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${tamperedPayload}.`;
    assert.equal((await h.api('GET', '/analytics', { token: unsigned })).status, 401);
    console.log('  ✓ Missing, forged, tampered and unsigned tokens are refused with 401');

    // Cross-user: bob naming alice in the query or the body still gets his own analytics
    for (const path of [`/analytics?userId=${alice.userId}`, `/analytics?user_id=${alice.userId}`]) {
      const res = await h.api('GET', path, { token: bob.token });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.currentMetrics.totalSkills, 0, `${path} returned alice's analytics to bob`);
    }
    const viaHeader = await fetch(`${h.origin}/api/v1/analytics`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${bob.token}`, 'X-User-Id': alice.userId },
    });
    assert.equal(viaHeader.status, 200);
    assert.equal((await viaHeader.json()).data.currentMetrics.totalSkills, 0, 'a user id header changed whose analytics were returned');
    console.log('  ✓ A user id in the query or a header cannot select another user\'s analytics');

    console.log('✅ Analytics Authorization Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runAnalyticsAuthorizationTests();
    } catch (err) {
      console.error('❌ Analytics Authorization Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
