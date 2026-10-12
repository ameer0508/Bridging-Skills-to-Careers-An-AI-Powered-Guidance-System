import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import RecalculationRun from '../models/RecalculationRun.js';
import { criteriaFor, SKILL_ASSESSMENTS, ASSESSMENT_BANK_VERSION, ASSESSMENT_PASS_MARK, ASSESSMENT_QUESTION_COUNT } from '../seed/skillAssessments.js';
import { ASSESSMENT_POLICY, assessableSkill } from '../services/SkillAssessmentService.js';
import { EVIDENCE_POINTS } from '../services/EvidenceCalculator.js';
import { canonicalSkillName } from '../utils/skillLexicon.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Skill checks: the question bank, taking and scoring an attempt, attempt limits and expiry,
 * what a pass does to evidence and scores, and what survives a resume being replaced or deleted.
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
  'REST service written in Node.js, tracked with Git.',
  '',
  'Skills:',
  'React, JavaScript, HTML, CSS, Node.js, Git'
].join('\n');

interface Presented {
  attemptId: string;
  skill: string;
  questions: Array<{ prompt: string; options: string[] }>;
}

async function waitForResume(h: HttpHarness, token: string) {
  for (let i = 0; i < 100; i++) {
    const resume = (await h.api('GET', '/resumes/me', { token })).body.data.resume;
    if (resume?.parsingStatus === 'completed') return;
    assert.notEqual(resume?.parsingStatus, 'failed', resume?.parsingError);
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}

/** Answers for an attempt with exactly `correct` right answers; the rest are wrong. */
function answersFor(attempt: Presented, correct: number): number[] {
  return attempt.questions.map((presented, index) => {
    const question = SKILL_ASSESSMENTS[attempt.skill].find(q => q.prompt === presented.prompt)!;
    const right = presented.options.indexOf(question.options[question.answer]);
    assert.ok(right >= 0, 'the correct option is among those presented');
    return index < correct ? right : (right + 1) % 4;
  });
}

export async function runSkillAssessmentTests() {
  console.log('🧪 Running Skill Assessment Tests...');

  // === The question bank ======================================================================
  const ids = new Set<string>();
  for (const [skill, questions] of Object.entries(SKILL_ASSESSMENTS)) {
    assert.equal(canonicalSkillName(skill), skill, `${skill} is the lexicon's name for the skill`);
    assert.equal(assessableSkill(skill.toLowerCase()), skill);
    assert.ok(questions.length > ASSESSMENT_QUESTION_COUNT, `${skill}: more questions than one attempt uses`);
    for (const question of questions) {
      assert.ok(!ids.has(question.id), `duplicate question id ${question.id}`);
      ids.add(question.id);
      assert.equal(new Set(question.options).size, 4, `${question.id}: four different options`);
      assert.ok([0, 1, 2, 3].includes(question.answer));
      assert.ok(question.prompt.length > 10 && question.explanation.length > 10);
    }
  }
  assert.equal(assessableSkill('js'), 'JavaScript', 'aliases resolve to the bank name');
  assert.equal(assessableSkill('Underwater Basket Weaving'), undefined);
  assert.match(ASSESSMENT_BANK_VERSION, /^[0-9a-f]{12}$/);
  assert.equal(ASSESSMENT_POLICY.points, EVIDENCE_POINTS.assessment);
  assert.ok(ASSESSMENT_POLICY.points < EVIDENCE_POINTS.projects[0], 'a quiz pass is worth less than using the skill in a project');
  console.log(`  ✓ Bank: ${Object.keys(SKILL_ASSESSMENTS).length} skills, ${ids.size} questions, unique ids, one answer each, canonical skill names`);

  await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();

  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');
    assert.ok([200, 201].includes((await h.api('POST', '/resumes/upload', { token: alice.token, form: resumeForm(RESUME) })).status));
    await waitForResume(h, alice.token);

    const overview = async (token: string) => (await h.api('GET', '/skills/assessments', { token })).body.data;
    const start = (token: string, skill: string) => h.api('POST', '/skills/assessments', { token, json: { skill } });
    const submit = (token: string, attemptId: string, answers: unknown) => h.api('POST', `/skills/assessments/${attemptId}/submit`, { token, json: { answers } });
    const freshness = async (token: string, name: string) => (await h.api('GET', '/skills/freshness', { token })).body.data.skills.find((s: any) => s.name === name);
    const scoreOf = async (token: string, careerTitle: string) =>
      ((await h.api('GET', '/careers/matches', { token })).body.data.matches as any[]).find(m => m.careerId.title === careerTitle)?.matchScore ?? 0;
    const runCount = () => RecalculationRun.countDocuments({ userId: alice.userId });

    // === Overview ===============================================================================
    let view = await overview(alice.token);
    assert.equal(view.skills.length, 8);
    const js0 = view.skills.find((s: any) => s.skill === 'JavaScript');
    assert.deepEqual(
      { onProfile: js0.onProfile, verified: js0.verified, attemptsRemaining: js0.attemptsRemaining, lastResult: js0.lastResult, inProgressAttemptId: js0.inProgressAttemptId },
      { onProfile: true, verified: false, attemptsRemaining: 3, lastResult: null, inProgressAttemptId: null }
    );
    assert.equal(view.skills.find((s: any) => s.skill === 'Docker').onProfile, false);
    assert.ok(view.skills.every((s: any) => s.passMark === criteriaFor(s.skill).passMark && s.questionCount === criteriaFor(s.skill).questionCount), 'each skill states its own passing criteria');
    assert.deepEqual(view.history, []);
    assert.match(view.note, /not a certification/);
    const jsBefore = js0.evidenceScore as number;

    // === Starting: no answers leave the server ===================================================
    const started = await start(alice.token, 'javascript');
    assert.equal(started.status, 201);
    const first = started.body.data.attempt as Presented;
    assert.equal(first.skill, 'JavaScript');
    assert.equal(first.questions.length, ASSESSMENT_QUESTION_COUNT);
    assert.ok(first.questions.every(q => q.options.length === 4 && Object.keys(q).sort().join() === 'options,prompt'), 'a question is a prompt and four options, nothing else');
    const sent = JSON.stringify(started.body);
    assert.ok(!SKILL_ASSESSMENTS.JavaScript.some(q => sent.includes(q.explanation)), 'no explanation is sent before submission');
    assert.ok(!/"answer"|"correct/.test(sent));

    // Asking again returns the attempt in progress instead of a fresh draw
    const again = await start(alice.token, 'JavaScript');
    assert.equal(again.status, 200);
    assert.equal(again.body.data.attempt.attemptId, first.attemptId);
    assert.deepEqual(again.body.data.attempt.questions, first.questions);
    assert.equal((await overview(alice.token)).skills.find((s: any) => s.skill === 'JavaScript').inProgressAttemptId, first.attemptId);

    // === Failing changes nothing ==================================================================
    const runsBefore = await runCount();
    const frontendBefore = await scoreOf(alice.token, 'Frontend Engineer');
    const failed = await submit(alice.token, first.attemptId, answersFor(first, ASSESSMENT_PASS_MARK - 1));
    assert.equal(failed.status, 200);
    assert.deepEqual(
      { correct: failed.body.data.correct, of: failed.body.data.of, passed: failed.body.data.passed, evidence: failed.body.data.evidence, recalculation: failed.body.data.recalculation },
      { correct: ASSESSMENT_PASS_MARK - 1, of: 5, passed: false, evidence: null, recalculation: null },
      'one short of the pass mark is not a pass'
    );
    assert.equal(failed.body.data.review.length, 5);
    for (const [i, item] of failed.body.data.review.entries()) {
      const question = SKILL_ASSESSMENTS.JavaScript.find(q => q.prompt === item.prompt)!;
      assert.equal(item.options[item.correctOption], question.options[question.answer], 'the review names the right option');
      assert.equal(item.correct, i < ASSESSMENT_PASS_MARK - 1);
      assert.equal(item.explanation, question.explanation);
    }
    assert.equal((await freshness(alice.token, 'JavaScript')).evidenceScore, jsBefore);
    assert.equal(await runCount(), runsBefore, 'a failed attempt triggers no recalculation');
    assert.equal((await submit(alice.token, first.attemptId, answersFor(first, 5))).body.error.code, 'ATTEMPT_ALREADY_SUBMITTED', 'an attempt cannot be answered twice');
    console.log('  ✓ Attempt: answers stay on the server until submission; a resumed attempt is the same one; a fail changes no score and cannot be resubmitted');

    // === Passing adds assessed evidence, once =====================================================
    const second = (await start(alice.token, 'JavaScript')).body.data.attempt as Presented;
    assert.notEqual(second.attemptId, first.attemptId);
    const unseen = SKILL_ASSESSMENTS.JavaScript.filter(q => !first.questions.some(f => f.prompt === q.prompt));
    assert.ok(unseen.every(q => second.questions.some(s => s.prompt === q.prompt)), 'questions not asked last time come first');

    const passed = (await submit(alice.token, second.attemptId, answersFor(second, ASSESSMENT_PASS_MARK))).body.data;
    assert.equal(passed.passed, true, 'the pass mark itself is a pass');
    assert.deepEqual(
      { added: passed.evidence.added, before: passed.evidence.evidenceScoreBefore, after: passed.evidence.evidenceScoreAfter },
      { added: true, before: jsBefore, after: Math.min(100, jsBefore + EVIDENCE_POINTS.assessment) }
    );
    assert.equal(passed.recalculation.status, 'completed');
    assert.deepEqual(passed.recalculation.modulesRecomputed, ['matches', 'readiness', 'recommendations']);
    const latestRun = await RecalculationRun.findOne({ userId: alice.userId }).sort({ createdAt: -1, _id: -1 });
    assert.equal(latestRun!.trigger, 'skill_evidence_changed');
    assert.equal(latestRun!.triggerRef, second.attemptId, 'the recalculation names the attempt that caused it');

    const jsFresh = await freshness(alice.token, 'JavaScript');
    assert.deepEqual({ status: jsFresh.status, verification: jsFresh.verification, score: jsFresh.evidenceScore }, { status: 'current', verification: 'assessed', score: passed.evidence.evidenceScoreAfter });
    assert.match(jsFresh.basis, /^Verified by a SkillBridge skill check: JavaScript \(4 of 5 correct\)\. Not a professional certification$/);
    assert.ok((await scoreOf(alice.token, 'Frontend Engineer')) >= frontendBefore, 'stronger evidence never lowers a match');

    // A second pass refreshes the date but earns nothing more
    const third = (await start(alice.token, 'JavaScript')).body.data.attempt as Presented;
    const repeat = (await submit(alice.token, third.attemptId, answersFor(third, 5))).body.data;
    assert.equal(repeat.passed, true);
    assert.deepEqual({ added: repeat.evidence.added, after: repeat.evidence.evidenceScoreAfter }, { added: false, after: passed.evidence.evidenceScoreAfter });
    assert.equal(repeat.recalculation.status, 'skipped_duplicate', 'no score input changed');
    const jsSkill = await mongoose.model('UserSkill').findById(repeat.evidence.userSkillId);
    assert.equal(jsSkill.evidences.filter((e: any) => e.sourceType === 'assessment').length, 1, 'one assessment record per skill');
    console.log(`  ✓ Pass: ${ASSESSMENT_PASS_MARK} of 5 adds ${EVIDENCE_POINTS.assessment} points as assessed evidence and recalculates once; passing again adds nothing`);

    // === Attempt limit ============================================================================
    const limited = await start(alice.token, 'JavaScript');
    assert.equal(limited.status, 429);
    assert.equal(limited.body.error.code, 'ASSESSMENT_ATTEMPT_LIMIT');
    view = await overview(alice.token);
    const jsLimited = view.skills.find((s: any) => s.skill === 'JavaScript');
    assert.equal(jsLimited.attemptsRemaining, 0);
    assert.ok(new Date(jsLimited.nextAttemptAt).getTime() > Date.now());
    assert.equal(jsLimited.verified, true);
    assert.deepEqual(jsLimited.lastResult.passed, true);
    assert.equal(view.history.length, 3);
    assert.deepEqual(view.history.map((a: any) => a.passed), [true, true, false], 'newest first');
    assert.equal((await start(alice.token, 'Git')).status, 201, 'the limit is per skill');
    // A day later the attempts are available again
    await AssessmentAttempt.updateMany({ userId: alice.userId, skillName: 'JavaScript' }, { $set: { startedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } });
    assert.equal((await overview(alice.token)).skills.find((s: any) => s.skill === 'JavaScript').attemptsRemaining, 3);

    // === Expiry ===================================================================================
    const late = (await start(alice.token, 'Docker')).body.data.attempt as Presented;
    await AssessmentAttempt.updateOne({ _id: late.attemptId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    const expired = await submit(alice.token, late.attemptId, answersFor(late, 5));
    assert.equal(expired.status, 409);
    assert.equal(expired.body.error.code, 'ATTEMPT_EXPIRED');
    view = await overview(alice.token);
    assert.equal(view.history.find((a: any) => a.attemptId === late.attemptId).status, 'expired');
    assert.equal(view.skills.find((s: any) => s.skill === 'Docker').verified, false, 'a correct but late submission earns nothing');
    console.log('  ✓ Limits: three attempts per skill per day, counted per skill; an attempt submitted after its time earns nothing');

    // === A skill the resume never mentioned ========================================================
    const devopsBefore = await scoreOf(alice.token, 'DevOps Engineer');
    const skillsBefore = (await h.api('GET', '/skills/freshness', { token: alice.token })).body.data.summary.total;
    const docker = (await start(alice.token, 'Docker')).body.data.attempt as Presented;
    const dockerPass = (await submit(alice.token, docker.attemptId, answersFor(docker, 5))).body.data;
    assert.deepEqual(
      { added: dockerPass.evidence.added, before: dockerPass.evidence.evidenceScoreBefore, after: dockerPass.evidence.evidenceScoreAfter },
      { added: true, before: null, after: EVIDENCE_POINTS.assessment },
      'the skill joins the profile with the assessment points only; it is not also counted as listed in a resume'
    );
    assert.equal((await h.api('GET', '/skills/freshness', { token: alice.token })).body.data.summary.total, skillsBefore + 1);
    assert.ok((await scoreOf(alice.token, 'DevOps Engineer')) > devopsBefore, 'a newly evidenced requirement raises the match');

    // === The evidence belongs to the user, not to the resume ======================================
    assert.equal((await h.api('POST', '/resumes/reprocess', { token: alice.token })).status, 202);
    await new Promise(r => setTimeout(r, 150));
    await waitForResume(h, alice.token);
    const jsAfter = await freshness(alice.token, 'JavaScript');
    const dockerAfter = await freshness(alice.token, 'Docker');
    assert.deepEqual({ score: jsAfter.evidenceScore, verification: jsAfter.verification }, { score: passed.evidence.evidenceScoreAfter, verification: 'assessed' });
    assert.deepEqual({ score: dockerAfter.evidenceScore, verification: dockerAfter.verification }, { score: EVIDENCE_POINTS.assessment, verification: 'assessed' }, 'kept although the resume does not mention it');

    assert.equal((await h.api('DELETE', '/resumes', { token: alice.token })).status, 200);
    const left = (await h.api('GET', '/skills/freshness', { token: alice.token })).body.data.skills as any[];
    assert.deepEqual(left.map(s => `${s.name}:${s.evidenceScore}:${s.verification}`).sort(), [`Docker:${EVIDENCE_POINTS.assessment}:assessed`, `JavaScript:${EVIDENCE_POINTS.assessment}:assessed`], 'deleting the resume removes resume evidence only');
    const matchesLeft = (await h.api('GET', '/careers/matches', { token: alice.token })).body.data.matches as any[];
    const { default: CareerScenarioService } = await import('../services/CareerScenarioService.js');
    const recomputed = await CareerScenarioService.compare(alice.userId, matchesLeft.slice(0, 2).map(m => m.careerId._id));
    for (const row of recomputed.careers) {
      assert.equal(row.matchScore, matchesLeft.find(m => m.careerId._id === row.careerId).matchScore, 'stored matches were recomputed from what is left');
    }
    assert.equal((await overview(alice.token)).history.length, 6, 'the attempt history is kept');
    console.log('  ✓ Ownership of evidence: a pass survives reprocessing and deleting the resume, and scores are recomputed from what remains');

    // === Ownership and validation ==================================================================
    const bobAttempt = (await start(bob.token, 'Git')).body.data.attempt as Presented;
    assert.equal((await submit(alice.token, bobAttempt.attemptId, answersFor(bobAttempt, 5))).status, 404, "another user's attempt cannot be submitted");
    assert.equal((await overview(bob.token)).history.length, 1);
    assert.equal((await overview(bob.token)).skills.every((s: any) => !s.verified), true);

    const bad: Array<[string, unknown, number, string]> = [
      ['/skills/assessments', {}, 400, 'VALIDATION_ERROR'],
      ['/skills/assessments', { skill: { $ne: '' } }, 400, 'VALIDATION_ERROR'],
      ['/skills/assessments', { skill: 'Git', userId: alice.userId }, 400, 'VALIDATION_ERROR'],
      ['/skills/assessments', { skill: 'Underwater Basket Weaving' }, 404, 'ASSESSMENT_NOT_AVAILABLE'],
      [`/skills/assessments/${bobAttempt.attemptId}/submit`, {}, 400, 'VALIDATION_ERROR'],
      [`/skills/assessments/${bobAttempt.attemptId}/submit`, { answers: [0, 1] }, 400, 'VALIDATION_ERROR'],
      [`/skills/assessments/${bobAttempt.attemptId}/submit`, { answers: [0, 1, 2, 3, 4] }, 400, 'VALIDATION_ERROR'],
      [`/skills/assessments/${bobAttempt.attemptId}/submit`, { answers: ['a', 'b', 'c', 'd', 'e'] }, 400, 'VALIDATION_ERROR'],
      ['/skills/assessments/not-an-id/submit', { answers: [0, 0, 0, 0, 0] }, 404, 'ATTEMPT_NOT_FOUND'],
      [`/skills/assessments/${new mongoose.Types.ObjectId()}/submit`, { answers: [0, 0, 0, 0, 0] }, 404, 'ATTEMPT_NOT_FOUND']
    ];
    for (const [path, json, status, code] of bad) {
      const res = await h.api('POST', path, { token: bob.token, json });
      assert.equal(res.status, status, `${path} ${JSON.stringify(json).slice(0, 50)}`);
      assert.equal(res.body.error.code, code);
    }
    // None of those spoiled the attempt; unanswered questions count as wrong
    const skipped = (await submit(bob.token, bobAttempt.attemptId, [null, null, null, null, null])).body.data;
    assert.deepEqual({ correct: skipped.correct, passed: skipped.passed }, { correct: 0, passed: false });
    assert.equal((await h.api('GET', '/skills/assessments')).status, 401);
    assert.equal((await h.api('POST', '/skills/assessments', { json: { skill: 'Git' } })).status, 401);
    assert.equal((await h.api('POST', `/skills/assessments/${bobAttempt.attemptId}/submit`, { json: { answers: [0, 0, 0, 0, 0] } })).status, 401);
    console.log(`  ✓ ${bad.length} invalid requests rejected; attempts are private to their owner; every endpoint requires sign-in`);

    console.log('✅ Skill Assessment Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runSkillAssessmentTests();
    } catch (err) {
      console.error('❌ Skill Assessment Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
