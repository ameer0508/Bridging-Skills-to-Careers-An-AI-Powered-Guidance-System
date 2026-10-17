import './setupEnv.js';
import assert from 'node:assert/strict';
import http from 'http';
import type { AddressInfo } from 'net';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import CareerService from '../services/CareerService.js';
import { GapAnalysis } from '../models/GapAnalysis.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';

/**
 * HTTP integration tests: real Express app, real middleware (auth, validation, upload,
 * error handling) and real routes, called over the network with fetch.
 * Backed by an in-memory MongoDB and the deterministic fake AI service.
 * These are distinct from the service-level tests, which call service classes directly.
 */

interface ApiResult<T = any> {
  status: number;
  body: T;
}

const RESUME_TEXT = [
  'Sam Candidate',
  'Email: sam.candidate@example.com',
  'Phone: +1 555-0100',
  '',
  'Experience:',
  'Frontend Developer at Example Co (2022-2024)',
  'Built dashboards with React, JavaScript, HTML and CSS.',
  '',
  'Projects:',
  'Shop API',
  'REST service written in Node.js, tracked with Git.',
  '',
  'Skills:',
  'React, JavaScript, HTML, CSS, Node.js, Git'
].join('\n');

// Minimal PDF-signed payload: passes the backend's content check; the fake AI reads the text
const pdfLikeResume = () => new Blob([`%PDF-1.4\n${RESUME_TEXT}\n`], { type: 'application/pdf' });

export async function runApiIntegrationTests() {
  console.log('🧪 Running HTTP API Integration Tests (real Express app over HTTP)...');

  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;

  const api = async <T = any>(
    method: string,
    path: string,
    options: { token?: string; json?: unknown; form?: FormData } = {}
  ): Promise<ApiResult<T>> => {
    const headers: Record<string, string> = {};
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    if (options.json !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: options.form ?? (options.json !== undefined ? JSON.stringify(options.json) : undefined)
    });
    const text = await res.text();
    let body: any = text;
    try {
      body = JSON.parse(text);
    } catch {
      // non-JSON response
    }
    return { status: res.status, body };
  };

  try {
    const stamp = Date.now();
    const alice = { fullName: 'Alice Api', email: `alice.${stamp}@example.com`, password: 'Password123!' };
    const bob = { fullName: 'Bob Api', email: `bob.${stamp}@example.com`, password: 'Password456!' };

    // --- Authentication ---------------------------------------------------
    assert.equal((await api('GET', '/users/me')).status, 401, 'protected route requires a token');
    const garbage = await api('GET', '/users/me', { token: 'not-a-jwt' });
    assert.equal(garbage.status, 401);
    assert.equal(garbage.body.error.code, 'INVALID_TOKEN');

    const badRegister = await api('POST', '/auth/register', { json: { email: 'nope', password: '1' } });
    assert.equal(badRegister.status, 400);
    assert.equal(badRegister.body.error.code, 'VALIDATION_ERROR');

    const registered = await api('POST', '/auth/register', { json: alice });
    assert.equal(registered.status, 201);
    assert.ok(registered.body.data.accessToken && registered.body.data.refreshToken);
    assert.equal(registered.body.data.user.passwordHash, undefined, 'hash never leaves the server');

    const duplicate = await api('POST', '/auth/register', { json: alice });
    assert.equal(duplicate.status, 400);
    assert.equal(duplicate.body.error.code, 'EMAIL_ALREADY_EXISTS');

    const wrongPassword = await api('POST', '/auth/login', {
      json: { email: alice.email, password: 'WrongPassword!' }
    });
    assert.equal(wrongPassword.status, 401);

    const login = await api('POST', '/auth/login', { json: { email: alice.email, password: alice.password } });
    assert.equal(login.status, 200);
    let aliceToken: string = login.body.data.accessToken;
    const firstRefresh: string = login.body.data.refreshToken;

    const refreshed = await api('POST', '/auth/refresh', { json: { refreshToken: firstRefresh } });
    assert.equal(refreshed.status, 200);
    aliceToken = refreshed.body.data.accessToken;
    const reused = await api('POST', '/auth/refresh', { json: { refreshToken: firstRefresh } });
    assert.equal(reused.status, 401, 'a rotated refresh token cannot be used again');
    assert.equal(reused.body.error.code, 'REVOKED_REFRESH_TOKEN');
    console.log('  ✓ Auth: validation, register, duplicate, login, refresh rotation, reuse detection');

    // Reuse detection revoked every session for Alice, so sign in again
    const relogin = await api('POST', '/auth/login', { json: { email: alice.email, password: alice.password } });
    aliceToken = relogin.body.data.accessToken;
    const aliceRefresh: string = relogin.body.data.refreshToken;

    // --- Profile and onboarding --------------------------------------------
    const me = await api('GET', '/users/me', { token: aliceToken });
    assert.equal(me.status, 200);
    assert.equal(me.body.data.email, alice.email);
    assert.equal(me.body.data.onboardingCompleted, false);

    const rejected = await api('PUT', '/users/me', { token: aliceToken, json: { role: 'admin' } });
    assert.equal(rejected.status, 400, 'unknown profile fields (e.g. role escalation) are rejected');

    const onboarded = await api('PUT', '/users/me', {
      token: aliceToken,
      json: {
        primaryCareerDomain: 'Software Engineering',
        targetRole: 'Frontend Engineer',
        onboardingCompleted: true
      }
    });
    assert.equal(onboarded.status, 200);
    assert.equal(onboarded.body.data.onboardingCompleted, true);
    assert.equal(onboarded.body.data.targetRole, 'Frontend Engineer');
    console.log('  ✓ Profile: read, strict update validation, onboarding completion');

    // Searched before any resume exists: unscored. The same search must be scored once skills
    // are on record (scores are computed per request, never served from a stale cache).
    const preResumeJobs = await api('GET', '/opportunities?search=Frontend', { token: aliceToken });
    assert.equal(preResumeJobs.body.data.opportunities[0].matchStatus, 'NO_CANDIDATE_EVIDENCE');

    // --- Resume upload and the downstream pipeline --------------------------
    const fakeForm = new FormData();
    fakeForm.append('resume', new Blob(['MZ this is not a pdf'], { type: 'application/pdf' }), 'resume.pdf');
    const fakeUpload = await api('POST', '/resumes/upload', { token: aliceToken, form: fakeForm });
    assert.equal(fakeUpload.status, 400);
    assert.equal(fakeUpload.body.error.code, 'INVALID_FILE_CONTENT');

    const exeForm = new FormData();
    exeForm.append('resume', new Blob(['%PDF-1.4'], { type: 'application/pdf' }), 'resume.exe');
    assert.equal((await api('POST', '/resumes/upload', { token: aliceToken, form: exeForm })).status, 400);

    const form = new FormData();
    form.append('resume', pdfLikeResume(), '../../My Resume (final).pdf');
    const upload = await api('POST', '/resumes/upload', { token: aliceToken, form });
    assert.equal(upload.status, 201);

    let resumeState: any = null;
    for (let i = 0; i < 60; i++) {
      const res = await api('GET', '/resumes/me', { token: aliceToken });
      resumeState = res.body.data.resume;
      if (resumeState && ['completed', 'failed'].includes(resumeState.parsingStatus)) break;
      await new Promise(r => setTimeout(r, 100));
    }
    assert.equal(resumeState?.parsingStatus, 'completed', `resume parsing: ${resumeState?.parsingError}`);
    assert.ok(resumeState.atsScore > 0);

    const skills = await api('GET', '/skills/me', { token: aliceToken });
    assert.equal(skills.status, 200);
    assert.ok(skills.body.data.totalSkills >= 5, 'skills extracted from the uploaded resume');

    const matches = await api('GET', '/careers/matches', { token: aliceToken });
    assert.equal(matches.status, 200);
    assert.ok(matches.body.data.matches.length > 0);
    const topMatch = matches.body.data.matches[0];
    assert.ok(topMatch.careerId?._id && topMatch.careerId?.title, 'match exposes the populated career');
    const careerId: string = topMatch.careerId._id;

    const readiness = await api('GET', '/readiness', { token: aliceToken });
    assert.equal(readiness.status, 200);
    assert.ok(readiness.body.data.readiness.length > 0);
    assert.ok(Array.isArray(readiness.body.data.readiness[0].gaps.criticalGaps));
    // Each entry carries its own career's stored gap analysis, not the empty fallback. The join used to
    // compare against the populated careerId ("[object Object]") and never matched.
    const entry = readiness.body.data.readiness[0];
    const storedGaps = await GapAnalysis.findOne({ userId: entry.userId, careerId: entry.careerId._id }).lean();
    assert.ok(storedGaps, 'a gap analysis is stored for the career');
    assert.equal(String(entry.gaps._id), String(storedGaps!._id), 'GET /readiness attaches the stored gap analysis');

    const recs = await api('GET', '/recommendations', { token: aliceToken });
    assert.equal(recs.status, 200);
    assert.ok(recs.body.data.recommendations.length > 0);

    const roadmap = await api('GET', `/roadmap/${careerId}`, { token: aliceToken });
    assert.equal(roadmap.status, 200);
    assert.ok(roadmap.body.data.roadmap, 'roadmap is generated on first request');
    const itemId: string = roadmap.body.data.roadmap.phases[0].items[0]._id;
    assert.ok(itemId);

    const itemDone = await api('PATCH', `/roadmap/${careerId}/items/${itemId}/status`, {
      token: aliceToken,
      json: { status: 'completed' }
    });
    assert.equal(itemDone.status, 200);
    assert.ok(itemDone.body.data.roadmap.progressPercentage > 0, 'update returns the saved roadmap');

    const badStatus = await api('PATCH', `/roadmap/${careerId}/items/${itemId}/status`, {
      token: aliceToken,
      json: { status: 'finished' }
    });
    assert.equal(badStatus.status, 400);
    assert.equal((await api('GET', '/roadmap/undefined', { token: aliceToken })).status, 400);

    const snapshot = await api('GET', '/users/me/career-snapshot', { token: aliceToken });
    assert.equal(snapshot.status, 200);
    assert.equal(snapshot.body.data.resumeInfo.hasResume, true);
    assert.ok(snapshot.body.data.totalSkills >= 5);
    assert.ok(snapshot.body.data.roadmapProgress > 0);
    console.log('  ✓ Journey: upload → skills → matches → readiness → recommendations → roadmap → snapshot');

    // --- Interviews -------------------------------------------------------
    const started = await api('POST', '/interviews', { token: aliceToken, json: { mode: 'technical', questionCount: 2 } });
    assert.equal(started.status, 201);
    const sessionId: string = started.body.data._id;

    const answered = await api('POST', `/interviews/${sessionId}/respond`, {
      token: aliceToken,
      json: { questionIndex: 0, candidateResponse: 'I implemented caching which reduced latency by 30%.' }
    });
    assert.equal(answered.status, 200);
    assert.equal(
      (await api('POST', `/interviews/${sessionId}/respond`, { token: aliceToken, json: { questionIndex: 99, candidateResponse: 'x' } })).status,
      400
    );
    const completed = await api('POST', `/interviews/${sessionId}/complete`, { token: aliceToken });
    assert.equal(completed.status, 200);
    const report = await api('GET', `/interviews/${sessionId}/report`, { token: aliceToken });
    assert.equal(report.status, 200);
    assert.ok(report.body.data.overallScore > 0);
    assert.ok(report.body.data.questions[0].candidateResponse);
    const history = await api('GET', '/interviews/history', { token: aliceToken });
    assert.equal(history.body.data.history.length, 1);
    console.log('  ✓ Interviews: start, answer, complete, report, history');

    // --- Opportunities -----------------------------------------------------
    const jobs = await api('GET', '/opportunities?search=Frontend', { token: aliceToken });
    assert.equal(jobs.status, 200);
    assert.equal(jobs.body.data.providerHealth.status, 'PENDING_CREDS', 'no live key in tests');
    const job = jobs.body.data.opportunities[0];
    const savedJob = await api('POST', '/opportunities/save', { token: aliceToken, json: job });
    assert.equal(savedJob.status, 201);
    const statusChange = await api('PATCH', `/opportunities/saved/${job.externalId}/status`, {
      token: aliceToken,
      json: { status: 'applied', notes: 'Sent CV' }
    });
    assert.equal(statusChange.status, 200);
    const savedList = await api('GET', '/opportunities/saved', { token: aliceToken });
    assert.equal(savedList.body.data.total, 1);
    assert.equal(savedList.body.data.savedOpportunities[0].notes, 'Sent CV');
    assert.ok(savedList.body.data.savedOpportunities[0].applicationUrl.startsWith('http'));
    console.log('  ✓ Opportunities: search (sample data), save, status change, saved list');

    // --- Cross-user isolation over HTTP ------------------------------------
    const bobRegistered = await api('POST', '/auth/register', { json: bob });
    const bobToken: string = bobRegistered.body.data.accessToken;

    assert.equal((await api('GET', `/interviews/${sessionId}`, { token: bobToken })).status, 404);
    assert.equal((await api('GET', `/interviews/${sessionId}/report`, { token: bobToken })).status, 404);
    assert.equal(
      (await api('PATCH', `/roadmap/${careerId}/items/${itemId}/status`, { token: bobToken, json: { status: 'skipped' } })).status,
      404
    );
    assert.equal(
      (await api('PATCH', `/opportunities/saved/${job.externalId}/status`, { token: bobToken, json: { status: 'offer' } })).status,
      404
    );
    assert.equal((await api('GET', '/opportunities/saved', { token: bobToken })).body.data.total, 0);
    assert.equal((await api('GET', '/skills/me', { token: bobToken })).body.data.totalSkills, 0);
    assert.equal((await api('GET', '/resumes/me', { token: bobToken })).body.data.resume, null);
    assert.equal((await api('GET', '/resumes/download', { token: bobToken })).status, 404);
    // A user with no resume gets no recommendations at all: nothing generic is invented
    const bobRecs = await api('GET', '/recommendations', { token: bobToken });
    assert.equal(bobRecs.status, 200);
    assert.deepEqual(bobRecs.body.data.recommendations, []);
    // ...and job postings come back unscored for them, with the reason
    const bobJobs = await api('GET', '/opportunities?search=Frontend', { token: bobToken });
    assert.equal(bobJobs.body.data.opportunities[0].skillbridgeMatchScore, null);
    assert.equal(bobJobs.body.data.opportunities[0].matchStatus, 'NO_CANDIDATE_EVIDENCE');
    // Alice, who has a resume, gets real scores for the same postings
    const aliceJobs = await api('GET', '/opportunities?search=Frontend', { token: aliceToken });
    const scored = aliceJobs.body.data.opportunities.find((o: any) => o.matchStatus === 'SCORED');
    assert.ok(scored, 'postings are scored for a user with evidenced skills');
    assert.ok(scored.skillbridgeMatchScore >= 0 && scored.skillbridgeMatchScore <= 100);
    assert.ok(scored.matchExplanation.length > 0);
    const aliceRoadmapAfter = await api('GET', `/roadmap/${careerId}`, { token: aliceToken });
    assert.equal(
      aliceRoadmapAfter.body.data.roadmap.phases[0].items[0].status,
      'completed',
      "another user's request must not alter Alice's roadmap"
    );
    console.log('  ✓ Isolation: another user cannot read or change interviews, roadmap, jobs, skills or resume');

    // --- Logout ------------------------------------------------------------
    assert.equal((await api('POST', '/auth/logout', { json: { refreshToken: aliceRefresh } })).status, 200);
    assert.equal((await api('POST', '/auth/refresh', { json: { refreshToken: aliceRefresh } })).status, 401);
    console.log('  ✓ Logout revokes the refresh token');

    console.log('✅ HTTP API Integration Tests Passed\n');
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runApiIntegrationTests();
    } catch (err) {
      console.error('❌ API Integration Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
