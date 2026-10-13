import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User.js';
import { AppError, errorHandler } from '../middlewares/errorHandler.js';
import CareerService from '../services/CareerService.js';
import RecommendationService from '../services/RecommendationService.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';
import { fillParams, listRoutes } from './helpers/routeInventory.js';

/**
 * V2: authentication, user isolation and input handling for every route the API serves, found by
 * reading the router rather than from a hand-kept list, so a new route is covered automatically.
 *
 *  A. Every route needs a valid token, except a reviewed public list; a missing, malformed,
 *     wrongly signed or expired token is refused.
 *  B. Every route with a path parameter answers malformed, traversal-like, oversized and unknown
 *     values without a server error.
 *  C. Oversized bodies are refused with 413, never a server error.
 *  D. A request that succeeded for Alice on her own object is replayed unchanged by Bob: it must
 *     fail, and Alice's objects must be unchanged afterwards.
 *  E. Administrator endpoints check the role in the database on every request.
 *  F. The public portfolio link and error responses expose nothing private.
 */

/** Reviewed public routes: everything else must refuse a request without a valid token. */
const PUBLIC = new Set([
  'GET /',
  'GET /health',
  'GET /api/v1',
  'POST /api/v1/auth/register',
  'POST /api/v1/auth/login',
  'POST /api/v1/auth/refresh',
  'POST /api/v1/auth/logout',
  'GET /api/v1/portfolio/shared/:token',
]);
const ADMIN = ['GET /api/v1/market/imports', 'GET /api/v1/ai-observability/summary', 'GET /api/v1/ai-observability/events', 'GET /api/v1/ai-observability/providers', 'GET /api/v1/realtime'];

const RESUME = [
  'Sam Candidate',
  'Email: sam.candidate@example.com',
  '',
  'Experience:',
  'Frontend Developer at Example Co (2022-2023)',
  'Built dashboards with React, JavaScript, HTML and CSS.',
  '',
  'Projects:',
  'Shop API',
  'REST service written in Node.js and SQL, tracked with Git.',
  '',
  'Skills:',
  'React, JavaScript, HTML, CSS, Node.js, Git, SQL',
].join('\n');

async function waitForResume(h: HttpHarness, token: string) {
  for (let i = 0; i < 100; i++) {
    const current = (await h.api('GET', '/resumes/me', { token })).body.data.resume;
    if (current?.parsingStatus === 'completed') return;
    assert.notEqual(current?.parsingStatus, 'failed', current?.parsingError);
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}


export async function runSecuritySweepTests() {
  console.log('🧪 Running Security Sweep (V2) Tests...');
  const fakeAi = await ensureFakeAiService();
  fakeAi.interview.mode = 'unavailable';
  await CareerService.seedInitialTaxonomy();
  await RecommendationService.seedInitialResources();
  const h = await startHttpHarness();
  const routes = listRoutes();
  const key = (r: { method: string; path: string }) => `${r.method} ${r.path}`;
  const call = (method: string, path: string, token?: string, body?: unknown, rawAuth?: string) =>
    fetch(h.origin + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(rawAuth ? { Authorization: rawAuth } : token ? { Authorization: `Bearer ${token}` } : {}) },
      body: ['GET', 'HEAD'].includes(method) ? undefined : JSON.stringify(body ?? {}),
    });

  try {
    // === A. Sign-in everywhere except the reviewed public routes =====================================
    assert.ok(routes.length >= 140, `route inventory found ${routes.length} routes`);
    const alice = await h.registerUser('sweep-alice');
    const expired = jwt.sign({ userId: alice.userId, role: 'user' }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: -10 });
    const forged = jwt.sign({ userId: alice.userId, role: 'admin' }, 'not-the-real-secret', { expiresIn: '5m' });
    const openRoutes: string[] = [];
    for (const r of routes) {
      const path = fillParams(r.path, '507f1f77bcf86cd799439011');
      const anonymous = await call(r.method, path);
      if (anonymous.status !== 401) openRoutes.push(key(r));
      if (PUBLIC.has(key(r))) continue;
      for (const [label, header] of [['malformed', 'Bearer not-a-token'], ['wrong secret', `Bearer ${forged}`], ['expired', `Bearer ${expired}`], ['no scheme', alice.token]] as const) {
        const res = await call(r.method, path, undefined, {}, header);
        assert.equal(res.status, 401, `${key(r)} with a ${label} token answered ${res.status}`);
      }
    }
    assert.deepEqual(openRoutes.sort(), [...PUBLIC].sort(), 'only the reviewed public routes answer without a token; review any new one before adding it');
    console.log(`  ✓ Sign-in: ${routes.length - PUBLIC.size} of ${routes.length} routes refuse missing, malformed, wrongly signed, expired and scheme-less tokens; ${PUBLIC.size} reviewed public routes`);

    // === B. Path parameters: malformed, traversal-like, oversized and unknown values ==================
    const parameterised = routes.filter(r => r.path.includes(':') && !PUBLIC.has(key(r)));
    const values = ['not-an-id', '../../etc/passwd', '..%2F..%2Fsecret', 'x'.repeat(400), '{"$gt":""}', '507f1f77bcf86cd799439011', '0', '-1'];
    let probes = 0;
    for (const r of parameterised) {
      if (r.path.includes('/recordings') && r.method === 'POST') continue; // multipart only; covered in voice suites
      for (const v of values) {
        const res = await call(r.method, fillParams(r.path, v), alice.token, {});
        probes++;
        assert.ok(res.status < 500, `${r.method} ${fillParams(r.path, v)} answered ${res.status}`);
      }
    }
    // A public share token that is not a token: refused without a server error
    for (const v of values) assert.ok((await call('GET', fillParams('/api/v1/portfolio/shared/:token', v))).status < 500);
    console.log(`  ✓ Parameters: ${probes} probes over ${parameterised.length} routes (malformed, traversal, 400 characters, operator objects, unknown ids): no server error`);

    // === C. Oversized and hostile bodies ================================================================
    const huge = JSON.stringify({ title: 'x'.repeat(11 * 1024 * 1024) });
    const big = await fetch(`${h.origin}/api/v1/portfolio`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${alice.token}` }, body: huge });
    assert.equal(big.status, 413, `an 11 MB body answered ${big.status}`);
    const malformed = await h.rawRequest('POST', '/portfolio', '{"title": "unterminated', alice.token);
    assert.equal(malformed.status, 400);
    const operator = await h.api('POST', '/portfolio', { token: alice.token, json: { title: { $gt: '' }, skills: ['Git'], completedOn: '2026-01-01' } });
    assert.equal(operator.status, 400, 'an operator object is not accepted as a title');
    console.log('  ✓ Bodies: 11 MB refused with 413, malformed JSON 400, operator objects 400');

    // === D. Cross-user replay ===========================================================================
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(RESUME) })).status));
    await waitForResume(h, alice.token);
    const A = (method: string, path: string, json?: unknown) => h.api(method, path, { token: alice.token, json });
    const owned: Array<{ method: string; path: string; json?: unknown }> = [];
    const keep = async (method: string, path: string, json?: unknown) => {
      const res = await A(method, path, json);
      assert.ok(res.status >= 200 && res.status < 300, `Alice: ${method} ${path} answered ${res.status} ${JSON.stringify(res.body?.error ?? '')}`);
      owned.push({ method, path, json });
      return res.body.data;
    };

    const skills = (await A('GET', '/skills/freshness')).body.data.skills as Array<{ userSkillId: string; name: string }>;
    const react = skills.find(s => s.name === 'React')!;
    await keep('POST', `/skills/${react.userSkillId}/revalidate`, { note: 'Used daily' });
    const careerId = ((await A('GET', '/careers/matches')).body.data.matches as Array<{ careerId: { _id: string } }>)[0].careerId._id;
    const roadmap = (await A('GET', `/roadmap/${careerId}`)).body.data.roadmap;
    const item = roadmap.phases.flatMap((p: { items: Array<{ _id: string }> }) => p.items)[0];
    await keep('PATCH', `/roadmap/${careerId}/items/${item._id}/status`, { status: 'in_progress' });
    const recs = (await A('GET', '/recommendations')).body.data;
    const recId = (recs.recommendations ?? recs)[0]?._id;
    if (recId) await keep('PATCH', `/recommendations/${recId}/status`, { status: 'saved_for_later' });
    const entry = (await keep('POST', '/portfolio', { title: 'Shop API', skills: ['Node.js'], completedOn: '2026-01-15', evidenceUrl: 'https://github.com/sam/shop-api' })).entry;
    await keep('PUT', `/portfolio/${entry.id}`, { title: 'Shop API', skills: ['Node.js', 'SQL'], completedOn: '2026-01-15', evidenceUrl: 'https://github.com/sam/shop-api' });
    const suggestion = (await A('GET', '/projects/suggestions')).body.data.suggestions?.[0];
    if (suggestion) {
      const project = (await keep('POST', '/projects', { briefId: suggestion.briefId })).project;
      await keep('PATCH', `/projects/${project.id}`, { status: 'in_progress' });
    }
    const exam = (await keep('POST', '/exams/gate-cs-2026/attempts', { count: 2, mode: 'practice' }));
    await keep('GET', `/exams/attempts/${exam.id}`);
    await keep('PUT', `/exams/attempts/${exam.id}/answers`, { questionId: exam.questions[0].questionId, response: null });
    const plan = (await keep('PUT', '/exams/gate-cs-2026/plan', { hoursPerWeek: 6 })).plan;
    await keep('PATCH', `/exams/gate-cs-2026/plan/items/${plan.items[0].id}`, { status: 'done' });
    const analysis = await keep('POST', '/languages/resume-analyses/text', { text: 'Habilidades\nPython, SQL y Docker en producción con equipos remotos.' });
    await keep('GET', `/languages/resume-analyses/${analysis.id}`);
    const interview = await keep('POST', '/interviews', { targetCareerTitle: 'Backend Engineer', questionCount: 3 });
    const sid = interview._id ?? interview.id;
    await keep('GET', `/interviews/${sid}`);
    await keep('POST', `/interviews/${sid}/respond`, { questionIndex: 0, candidateResponse: 'I would use a queue so that slow work happens later, because users should not wait for email to send.' });
    const assessment = await keep('POST', '/interviews/assessments', { skills: ['SQL'], count: 3 });
    await keep('GET', `/interviews/assessments/${assessment.id}`);
    const conversation = await keep('POST', '/ai', {});
    const conversationId = conversation._id ?? conversation.id ?? conversation.conversation?._id;
    if (conversationId) await keep('GET', `/ai/${conversationId}`);
    const application = (await keep('POST', '/applications/manual', { title: 'Data Analyst', company: 'Example Ltd', applicationUrl: 'https://careers.example.com/1', appliedAt: '2026-09-02T00:00:00.000Z' })).application;
    await keep('GET', `/applications/${application.id}/history`);
    await keep('POST', `/applications/${application.id}/events`, { status: 'interviewing', occurredAt: '2026-09-15T09:00:00.000Z' });
    const plans = await keep('POST', '/careers/transition-plans', { targetCareerId: careerId });
    const planId = plans.plan?.id ?? plans.id;

    const snapshotOfAlice = async () => JSON.stringify({
      portfolio: (await A('GET', '/portfolio')).body.data.entries.map((e: { id: string; title: string; skills: unknown }) => [e.id, e.title, e.skills]),
      attempt: (await A('GET', `/exams/attempts/${exam.id}`)).body.data.questions.map((q: { response: unknown }) => q.response),
      plan: (await A('GET', '/exams/gate-cs-2026/plan')).body.data.plan.items.map((i: { id: string; status: string }) => [i.id, i.status]),
      analysis: (await A('GET', `/languages/resume-analyses/${analysis.id}`)).status,
      interview: (await A('GET', `/interviews/${sid}`)).body.data.questions?.map((q: { candidateResponse?: string }) => q.candidateResponse ?? null),
      application: (await A('GET', `/applications/${application.id}/history`)).body.data.events?.length,
      skills: (await A('GET', '/skills/freshness')).body.data.skills.map((s: { name: string; evidenceScore: number }) => [s.name, s.evidenceScore]),
    });
    const before = await snapshotOfAlice();

    const bob = await h.registerUser('sweep-bob');
    let replayed = 0;
    // Only requests that name one of her objects are replayed (creating your own plan is not); the
    // destructive ones run last, so every read and write meets objects that still exist
    const destructive = [
      ['DELETE', `/portfolio/${entry.id}`], ['DELETE', `/languages/resume-analyses/${analysis.id}`],
      ['POST', `/exams/attempts/${exam.id}/submit`], ['POST', `/interviews/${sid}/complete`],
      ['POST', `/interviews/assessments/${assessment.id}/finish`],
      ...(planId ? [['DELETE', `/careers/transition-plans/${planId}`]] : []),
    ] as Array<[string, string]>;
    for (const r of [...owned.filter(o => /\/[0-9a-f]{24}(\/|$)/.test(o.path)), ...destructive.map(([method, path]) => ({ method, path, json: {} }))]) {
      const res = await h.api(r.method, r.path, { token: bob.token, json: r.json });
      replayed++;
      assert.ok([403, 404].includes(res.status), `Bob replaying ${r.method} ${r.path} answered ${res.status}`);
    }
    // Bob's own lists show none of Alice's objects
    for (const p of ['/portfolio', '/exams/gate-cs-2026/attempts', '/languages/resume-analyses', '/interviews/assessments', '/applications', '/careers/transition-plans', '/ai']) {
      const res = await h.api('GET', p, { token: bob.token });
      assert.ok(!JSON.stringify(res.body).includes(alice.userId), `${p}: Bob's list mentions Alice`);
      for (const id of [entry.id, exam.id, analysis.id, assessment.id, application.id, sid]) assert.ok(!JSON.stringify(res.body).includes(String(id)), `${p}: Bob sees Alice's ${id}`);
    }
    assert.equal(await snapshotOfAlice(), before, "Alice's objects are unchanged after Bob's replays");
    console.log(`  ✓ Isolation: ${replayed} of Alice's requests on her own objects (${replayed - destructive.length} reads and writes, ${destructive.length} destructive) replayed by Bob, all 403/404; Bob's lists show none of her objects; her data unchanged`);

    // === D2. Races: concurrent requests leave consistent state ===========================================
    const carol = await h.registerUser('sweep-carol');
    const C = (method: string, path: string, json?: unknown) => h.api(method, path, { token: carol.token, json });
    // Answers fired together with the submission: whatever was stored is exactly what was scored
    const raced = (await C('POST', '/exams/gate-cs-2026/attempts', { count: 6, mode: 'practice' })).body.data;
    await Promise.all([
      ...raced.questions.map((q: { questionId: string; type?: string }) => C('PUT', `/exams/attempts/${raced.id}/answers`, { questionId: q.questionId, response: 0 })),
      C('POST', `/exams/attempts/${raced.id}/submit`),
      C('POST', `/exams/attempts/${raced.id}/submit`),
    ]);
    const settled = (await C('GET', `/exams/attempts/${raced.id}`)).body.data;
    assert.equal(settled.status, 'completed');
    for (const q of settled.questions as Array<{ response: unknown; outcome: string; marksAwarded: number }>) {
      assert.equal(q.response === null, q.outcome === 'unanswered', 'every stored answer was scored, and only stored answers were');
    }
    const summed = Math.round(settled.questions.reduce((sum: number, q: { marksAwarded: number }) => sum + q.marksAwarded, 0) * 100) / 100;
    assert.equal(settled.score.marks, summed, 'the score is the sum of the stored marks');
    // Six simultaneous starts of one skill check open one attempt, not six against the daily limit
    const starts = await Promise.all(Array.from({ length: 6 }, () => C('POST', '/skills/assessments', { skill: 'Git' })));
    assert.equal(new Set(starts.map(r => r.body.data.attempt.id ?? r.body.data.attempt.attemptId)).size, 1, 'one attempt, resumed by the others');
    // The same job saved six times at once is one saved job
    const job = (await C('GET', '/opportunities?search=Developer')).body.data.opportunities[0];
    await Promise.all(Array.from({ length: 6 }, () => C('POST', '/opportunities/save', job)));
    assert.equal((await C('GET', '/opportunities/saved')).body.data.total, 1);
    // Six identical portfolio entries at once: six records kept, the project credited once
    await Promise.all(Array.from({ length: 6 }, () => C('POST', '/portfolio', { title: 'Race Tracker', skills: ['Docker'], completedOn: '2026-02-01', evidenceUrl: 'https://github.com/carol/race-tracker' })));
    const raceEntries = (await C('GET', '/portfolio')).body.data.entries as Array<{ skills: Array<{ points: number }> }>;
    assert.equal(raceEntries.length, 6);
    assert.equal(raceEntries.filter(e => e.skills[0].points > 0).length, 1, 'credited once');
    console.log('  ✓ Races: answers racing a double submission are scored exactly as stored; 6 simultaneous skill-check starts open 1 attempt; 6 saves of a job make 1; 6 identical entries are credited once');

    // === E. Administrator endpoints: role read from the database on every request ======================
    for (const route of ADMIN) {
      const [method, path] = route.split(' ');
      assert.equal((await call(method, path, alice.token)).status, 403, `${route} refuses a user`);
    }
    await User.updateOne({ _id: alice.userId }, { $set: { role: 'admin' } });
    for (const route of ADMIN) {
      const [method, path] = route.split(' ');
      const res = await call(method, path, alice.token);
      assert.ok(res.status === 200 || res.status === 503, `${route} as an administrator answered ${res.status}`);
    }
    await User.updateOne({ _id: alice.userId }, { $set: { role: 'user' } });
    for (const route of ADMIN) {
      const [method, path] = route.split(' ');
      assert.equal((await call(method, path, alice.token)).status, 403, `${route} after demotion`);
    }
    // A token claiming admin, signed correctly, does not make a user an administrator
    const claims = jwt.sign({ userId: bob.userId, role: 'admin' }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '5m' });
    for (const route of ADMIN) {
      const [method, path] = route.split(' ');
      assert.equal((await call(method, path, claims)).status, 403, `${route} trusts the role in the token`);
    }
    console.log(`  ✓ Administrators: ${ADMIN.length} endpoints refuse users, admit administrators, refuse after demotion and ignore an admin claim in a token`);

    // === F. Public link and error responses expose nothing private ====================================
    const share = (await h.api('PUT', '/portfolio/share', { token: alice.token, json: { enabled: true } })).body.data.share;
    const publicView = await h.api('GET', `/portfolio/shared/${share.token}`);
    const exposed = JSON.stringify(publicView.body);
    assert.equal(publicView.status, 200);
    assert.ok(!exposed.includes(alice.email) && !exposed.includes(alice.userId) && !/"_id"|"userId"/.test(exposed), 'the public link exposes no e-mail address or ids');
    for (const res of [await call('GET', '/api/v1/exams/attempts/not-an-id', alice.token), await call('GET', '/api/v1/nope', alice.token), await call('POST', '/api/v1/portfolio', alice.token, { title: 1 })]) {
      const text = await res.text();
      assert.ok(!/\bat [A-Za-z]+ \(|node_modules|[A-Z]:\\\\|\/src\/|stack/i.test(text), `an error response leaks internals: ${text.slice(0, 200)}`);
    }
    // An unexpected error's own message stays in the log; a client error without a code gets one
    const respond = (err: Error) => {
      const out: { status?: number; body?: { error: { code: string; message: string } } } = {};
      const res = { status(s: number) { out.status = s; return this; }, json(b: never) { out.body = b; return this; } };
      errorHandler(err, { method: 'GET', originalUrl: '/x' } as never, res as never, () => {});
      return out;
    };
    const internal = respond(new Error('connect ECONNREFUSED mongodb://admin:hunter2@db.internal:27017'));
    assert.deepEqual([internal.status, internal.body?.error.code, internal.body?.error.message], [500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred on the server.']);
    assert.equal(respond(new AppError('Invalid status value.', 400)).body?.error.code, 'BAD_REQUEST', 'a 400 is not labelled a server error');
    assert.equal(respond(new AppError('AI is unavailable.', 503, 'AI_UNAVAILABLE')).body?.error.message, 'AI is unavailable.', 'deliberate messages are kept');
    console.log('  ✓ Exposure: the public portfolio link shows no e-mail or ids; error responses carry no stack traces, file paths or internal messages; 4xx codes match their status');
  } finally {
    await h.close();
  }
  console.log('✅ Security Sweep (V2) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runSecuritySweepTests();
    } catch (err) {
      console.error('❌ Security Sweep Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
      process.exit();
    }
  })();
}
