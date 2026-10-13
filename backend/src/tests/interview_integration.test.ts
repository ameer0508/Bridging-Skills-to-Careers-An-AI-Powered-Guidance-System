import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import RecalculationRun from '../models/RecalculationRun.js';
import { QUESTIONS_BY_ID } from '../services/exams/ExamPracticeService.js';
import { API_RATE_LIMIT_MAX } from '../app.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Where the interview features meet career intelligence: practice in the interview area must not
 * leak into skill evidence, scores, the next-step ranking or the learning streak beyond what is
 * documented, and must stay private to its owner.
 */

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
  'React, JavaScript, HTML, CSS, Node.js, Git, SQL'
].join('\n');

async function waitForResume(h: HttpHarness, token: string) {
  await new Promise(r => setTimeout(r, 150));
  for (let i = 0; i < 100; i++) {
    const current = (await h.api('GET', '/resumes/me', { token })).body.data.resume;
    if (current?.parsingStatus === 'completed') return;
    assert.notEqual(current?.parsingStatus, 'failed', current?.parsingError);
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}

export async function runInterviewIntegrationTests() {
  console.log('🧪 Running Interview / Career Intelligence Integration Tests...');
  const fakeAi = await ensureFakeAiService();
  fakeAi.interview.mode = 'unavailable';
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();
  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');
    const A = (method: string, url: string, json?: unknown) => h.api(method, url, { token: alice.token, json });
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(RESUME) })).status));
    await waitForResume(h, alice.token);

    const state = async () =>
      JSON.stringify({
        skills: ((await A('GET', '/skills/freshness')).body.data.skills as any[]).map(s => [s.name, s.evidenceScore, s.verification]).sort(),
        matches: ((await A('GET', '/careers/matches')).body.data.matches as any[]).map(m => [m.careerId.title, m.matchScore]),
        readiness: ((await A('GET', '/readiness')).body.data.readiness as any[]).map(r => [r.careerId.title, r.overallScore, r.evidenceBasis?.assessed]),
        nextActions: ((await A('GET', '/recommendations/next-actions')).body.data.actions as any[]).map(a => [a.id, a.score]),
        runs: await RecalculationRun.countDocuments({ userId: alice.userId })
      });
    const before = await state();
    const streakBefore = (await A('GET', '/activity')).body.data.streak.current;

    // === A technical assessment answered perfectly is practice, not evidence ========================
    const started = (await A('POST', '/interviews/assessments', { skills: ['SQL'], count: 3 })).body.data;
    assert.equal(started.tasks.length, 3);
    assert.ok(!JSON.stringify(started).match(/"correctAnswer"|"explanation"|"answer"\s*:/), 'no answer key is sent with the tasks');
    for (const item of started.tasks) {
      // Whatever is sent, the stored state shows only whether it was right, after it was answered
      const answered = await A('POST', `/interviews/assessments/${started.id}/answers`, { taskId: item.taskId, response: item.kind === 'choice' || item.kind === 'line' ? 0 : '0' });
      assert.ok([200, 400].includes(answered.status), `answer ${answered.status}`);
    }
    const finished = await A('POST', `/interviews/assessments/${started.id}/finish`);
    assert.equal(finished.status, 200);
    assert.ok(finished.body.data.score && typeof finished.body.data.score.percent === 'number');
    assert.equal(await state(), before, 'a technical assessment changes no skill, verification, match, readiness, next step or recalculation');
    const sql = ((await A('GET', '/skills/freshness')).body.data.skills as any[]).find(s => s.name === 'SQL');
    assert.notEqual(sql.verification, 'assessed', 'a practice assessment does not verify the skill; only a skill check does');
    assert.equal((await A('GET', '/skills/assessments')).body.data.skills.find((s: any) => s.skill === 'SQL').verified, false);
    assert.equal((await A('GET', '/activity')).body.data.streak.current, streakBefore, 'it is not counted as learning activity either');

    // The two kinds of assessment are separate records with separate owners
    assert.equal((await h.api('GET', `/interviews/assessments/${started.id}`, { token: bob.token })).status, 404);
    assert.equal((await h.api('GET', '/interviews/assessments', { token: bob.token })).body.data.assessments.length, 0);
    assert.equal((await h.api('GET', '/skills/assessments', { token: bob.token })).body.data.history.length, 0);
    console.log('  ✓ Technical assessment: no answer key before answering; a finished one leaves skills, scores, readiness, next steps, recalculations and the streak unchanged');

    // === Exam practice, study plans and resume-language checks are not career evidence (E2-E5) =====
    // SQL and databases overlap the resume on purpose: a perfect database score must still add nothing
    for (const [examId, body] of [
      ['gate-cs-2026', { count: 4, mode: 'practice', sectionIds: ['db'] }],
      ['ssc-cgl-2026-tier1', { count: 4, mode: 'practice' }],
    ] as const) {
      const attempt = (await A('POST', `/exams/${examId}/attempts`, body)).body.data;
      assert.ok(attempt?.id, `${examId} attempt started`);
      for (const q of attempt.questions) {
        const key = QUESTIONS_BY_ID.get(q.questionId)!.answer;
        const response = 'index' in key ? key.index : 'indices' in key ? key.indices : key.value;
        assert.equal((await A('PUT', `/exams/attempts/${attempt.id}/answers`, { questionId: q.questionId, response })).status, 200);
      }
      const submitted = (await A('POST', `/exams/attempts/${attempt.id}/submit`)).body.data;
      assert.equal(submitted.score.marks, submitted.score.maxMarks, `${examId}: every answer correct`);
    }
    const plan = (await A('PUT', '/exams/gate-cs-2026/plan', { hoursPerWeek: 6 })).body.data.plan;
    assert.equal((await A('PATCH', `/exams/gate-cs-2026/plan/items/${plan.items[0].id}`, { status: 'done' })).status, 200);
    assert.equal((await A('POST', '/languages/resume-analyses/text', { text: 'Habilidades\nPython, SQL, Docker y Kubernetes en producción.' })).status, 201);
    assert.equal(await state(), before, 'exam practice, a study plan and a language check change no skill, match, readiness, next step or recalculation');
    assert.equal((await A('GET', '/activity')).body.data.streak.current, streakBefore, 'nor the learning streak');
    console.log('  ✓ Exam attempts (GATE, SSC), a completed study-plan item and a Spanish resume check leave skills, scores, readiness, next steps, recalculations and the streak unchanged');

    // === A completed interview: recommendations may follow, evidence may not ========================
    const session = (await A('POST', '/interviews', { mode: 'mixed', questionCount: 3 })).body.data;
    assert.equal(session.questionSource, 'question_bank', 'with the AI unavailable the questions come from the local bank, and say so');
    for (let index = 0; index < session.questions.length; index++) {
      const r = await A('POST', `/interviews/${session._id}/respond`, { questionIndex: index, candidateResponse: 'I used React and JavaScript to build a dashboard, measured load time before and after, and cut it by reorganising the data fetching.' });
      assert.equal(r.status, 200);
    }
    assert.equal((await A('POST', `/interviews/${session._id}/complete`)).status, 200);
    const report = (await A('GET', `/interviews/${session._id}/report`)).body.data;
    assert.ok(!JSON.stringify(report).match(/Mock AI|mock provider/i), 'no mock AI output is presented as an evaluation');
    const after = JSON.parse(await state());
    const was = JSON.parse(before);
    assert.deepEqual(after.skills, was.skills, 'an interview adds no skill evidence');
    assert.deepEqual(after.matches, was.matches, 'and changes no match score');
    assert.deepEqual(after.readiness, was.readiness);
    assert.equal(after.runs, was.runs + 1, 'one recalculation, for recommendations only');
    const run = await RecalculationRun.findOne({ userId: alice.userId }).sort({ createdAt: -1, _id: -1 });
    assert.deepEqual([run!.trigger, run!.modulesRecomputed], ['interview_completed', ['recommendations']]);
    assert.equal((await A('GET', '/activity')).body.data.streak.current, 1, 'a completed interview is recorded learning activity');
    assert.equal((await h.api('GET', `/interviews/${session._id}/report`, { token: bob.token })).status, 404);
    console.log('  ✓ Interview: rule-based and labelled when the AI is unavailable; it refreshes recommendations only, counts for the streak, and is private');

    // The general rate limit keeps its production default unless configured
    assert.equal(API_RATE_LIMIT_MAX, 100000, 'the test environment raises the general limit explicitly');
    console.log('✅ Interview / Career Intelligence Integration Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runInterviewIntegrationTests();
    } catch (err) {
      console.error('❌ Interview Integration Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
