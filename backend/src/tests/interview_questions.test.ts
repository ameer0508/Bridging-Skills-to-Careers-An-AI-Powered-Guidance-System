import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import CareerService from '../services/CareerService.js';
import {
  categoryPlan,
  selectFromQuestionBank,
  INTERVIEW_MODES,
  type QuestionContext
} from '../services/InterviewQuestionGenerator.js';
import { INTERVIEW_QUESTION_BANK, roleFamilies } from '../seed/interviewQuestionBank.js';
import { extractSkills } from '../utils/skillLexicon.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness, resumeForm, type HttpHarness } from './helpers/httpHarness.js';

/**
 * Interview question generation: the deterministic question bank (variety, grounding in the
 * user's own data, no repeats, role and job specificity), the AI path with its fallbacks, and
 * interview history / report persistence over HTTP.
 */

const baseContext = (overrides: Partial<QuestionContext> = {}): QuestionContext => ({
  userId: '64b000000000000000000001',
  roleTitle: 'Full Stack Developer',
  mode: 'mixed',
  count: 5,
  skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Git'],
  gaps: ['Docker', 'CI/CD'],
  experience: ['Software Engineering Intern at Example Co'],
  projects: ['Campus Marketplace'],
  recentQuestionIds: [],
  recentQuestionTexts: [],
  sessionOrdinal: 0,
  ...overrides
});

const RESUME = [
  'Sam Candidate',
  'Email: sam.candidate@example.com',
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

async function uploadAndWait(h: HttpHarness, token: string) {
  assert.equal((await h.api('POST', '/resumes/upload', { token, form: resumeForm(RESUME) })).status, 201);
  for (let i = 0; i < 100; i++) {
    const resume = (await h.api('GET', '/resumes/me', { token })).body.data.resume;
    if (resume && ['completed', 'failed'].includes(resume.parsingStatus)) {
      assert.equal(resume.parsingStatus, 'completed', resume.parsingError);
      return;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  assert.fail('resume was not processed in time');
}

export async function runInterviewQuestionTests() {
  console.log('🧪 Running Interview Question Generation Tests...');

  // === The bank itself =======================================================================
  assert.ok(INTERVIEW_QUESTION_BANK.length >= 100, `bank has ${INTERVIEW_QUESTION_BANK.length} questions`);
  assert.equal(new Set(INTERVIEW_QUESTION_BANK.map(b => b.id)).size, INTERVIEW_QUESTION_BANK.length, 'bank ids are unique');
  for (const category of ['technical', 'behavioral', 'project', 'resume', 'career']) {
    assert.ok(INTERVIEW_QUESTION_BANK.filter(b => b.category === category).length >= 8, `enough ${category} questions`);
  }
  for (const entry of INTERVIEW_QUESTION_BANK) {
    const placeholders = [...entry.text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).filter(p => p !== 'role');
    assert.deepEqual([...new Set(placeholders)].sort(), [...(entry.needs || [])].sort(), `${entry.id}: placeholders match declared needs`);
    assert.ok(entry.concepts.length >= 2, `${entry.id}: has expected concepts`);
  }
  console.log(`  ✓ Bank: ${INTERVIEW_QUESTION_BANK.length} questions, unique ids, placeholders declared, every category covered`);

  // === Selection ============================================================================
  for (const mode of INTERVIEW_MODES) {
    for (const count of [3, 5, 8]) {
      const ctx = baseContext({ mode, count });
      const questions = selectFromQuestionBank(ctx);
      assert.equal(questions.length, count, `${mode}/${count}: right number of questions`);
      assert.equal(new Set(questions.map(q => q.questionId)).size, count, `${mode}/${count}: no duplicates`);
      assert.equal(new Set(questions.map(q => q.question)).size, count);
      assert.deepEqual(questions.map(q => q.category), categoryPlan(mode, count), `${mode}/${count}: follows the category plan`);
      for (const question of questions) {
        assert.ok(!/[{}]/.test(question.question), `no unfilled placeholder: ${question.question}`);
        assert.equal(question.source, 'question_bank');
        assert.ok(question.groundedIn, 'every question says what it is based on');
        // A question may only name skills the user has, lacks for the role, or (not here) a posting asks for
        const allowed = new Set([...ctx.skills, ...ctx.gaps].map(s => s.toLowerCase()));
        const named = extractSkills(question.question).filter(s => !allowed.has(s.toLowerCase()));
        assert.deepEqual(named, [], `question names a skill not on record: "${question.question}"`);
      }
    }
  }
  const technical = selectFromQuestionBank(baseContext({ mode: 'technical', count: 6 }));
  assert.ok(technical.some(q => /^Skill on your resume/.test(q.groundedIn || '')), 'technical rounds use the resume skills');
  assert.ok(technical.some(q => /^Gap for your target role/.test(q.groundedIn || '')), 'technical rounds probe a gap');
  assert.ok(new Set(technical.map(q => q.groundedIn)).size >= 4, 'questions are spread over different facts');
  console.log('  ✓ Selection: every mode and length is complete, unique, on plan and names only skills on record');

  // Deterministic, varied between sessions, and not repeated
  const first = selectFromQuestionBank(baseContext());
  assert.deepEqual(selectFromQuestionBank(baseContext()), first, 'same inputs give the same questions');
  const second = selectFromQuestionBank(
    baseContext({ sessionOrdinal: 1, recentQuestionIds: first.map(q => q.questionId), recentQuestionTexts: first.map(q => q.question) })
  );
  assert.equal(second.filter(q => first.some(f => f.questionId === q.questionId)).length, 0, 'the next session repeats nothing');
  const seen = new Set<string>();
  let recentIds: string[] = [];
  for (let ordinal = 0; ordinal < 6; ordinal++) {
    const round = selectFromQuestionBank(baseContext({ mode: 'technical', sessionOrdinal: ordinal, recentQuestionIds: recentIds }));
    for (const question of round) {
      assert.ok(!seen.has(question.questionId), `question repeated across six sessions: ${question.questionId}`);
      seen.add(question.questionId);
    }
    recentIds = [...round.map(q => q.questionId), ...recentIds];
  }
  assert.equal(seen.size, 30, 'six technical sessions give thirty different questions');
  console.log('  ✓ Variety: deterministic per session, 30 distinct questions over six technical sessions');

  // Role specific
  assert.deepEqual(roleFamilies('Data Analyst'), ['data']);
  assert.ok(roleFamilies('Full Stack Developer').includes('frontend') && roleFamilies('Full Stack Developer').includes('backend'));
  assert.deepEqual(roleFamilies('Astronaut'), ['software'], 'an unknown title gets the general set, not a guess');
  const analyst = selectFromQuestionBank(
    baseContext({ roleTitle: 'Data Analyst', mode: 'technical', count: 8, skills: ['SQL', 'Excel', 'Python'], gaps: ['Tableau'], projects: [], experience: [] })
  );
  assert.ok(analyst.some(q => q.questionId.startsWith('fam_data_') || q.questionId.startsWith('sk_sql_')), 'data roles get data questions');
  assert.ok(!analyst.some(q => /^fam_(fe|mobile|ops|sec|design)_/.test(q.questionId)), 'and no questions from unrelated families');
  assert.ok(!analyst.some(q => /React|Kubernetes|Docker/.test(q.question)));

  // Nothing on record: still a full, honest set
  const empty = selectFromQuestionBank(
    baseContext({ roleTitle: 'General Interview Practice', skills: [], gaps: [], experience: [], projects: [], mode: 'mixed', count: 6 })
  );
  assert.equal(empty.length, 6);
  assert.ok(empty.every(q => !/[{}]/.test(q.question) && extractSkills(q.question).length === 0), 'no skill, employer or project is invented');
  console.log('  ✓ Role specific: families follow the role title; an empty profile still gets a full set with nothing invented');

  // Job posting
  const job = {
    title: 'Platform Engineer',
    company: 'Example Cloud Ltd',
    description: 'We use Kubernetes and React.',
    matchedSkills: ['React'],
    missingSkills: ['Kubernetes']
  };
  const forJob = selectFromQuestionBank(baseContext({ mode: 'mixed', count: 6, job }));
  const tied = forJob.filter(q => /job posting/i.test(q.groundedIn || ''));
  assert.ok(tied.length >= 3, `at least half of a mixed session is tied to the posting (got ${tied.length})`);
  assert.ok(forJob.some(q => q.question.includes('Example Cloud Ltd')));
  const kubernetes = forJob.filter(q => q.question.includes('Kubernetes'));
  assert.ok(kubernetes.every(q => q.questionId.startsWith('car_job_gap') || q.questionId.startsWith('job_skill') || q.questionId.startsWith('sk_k8s')));
  assert.ok(!forJob.some(q => q.questionId === 'job_skill_evidence:kubernetes'), 'a skill the user lacks is asked about as a gap, not as experience');
  const behavioralJob = selectFromQuestionBank(baseContext({ mode: 'behavioral', count: 4, job }));
  assert.equal(behavioralJob.filter(q => /job posting/i.test(q.groundedIn || '')).length, 1, 'a behavioural session keeps its character');
  assert.ok(behavioralJob[0].question.includes('Example Cloud Ltd'));
  console.log('  ✓ Job specific: posting questions use its employer and skills, and treat missing skills as gaps');

  // === Sessions over HTTP: source labels, AI path, history and report ===================================
  const fakeAi = await ensureFakeAiService();
  await CareerService.seedInitialTaxonomy();
  const h = await startHttpHarness();
  try {
    const alice = await h.registerUser('alice');
    const bob = await h.registerUser('bob');
    assert.equal((await h.api('PUT', '/users/me', { token: alice.token, json: { targetRole: 'Frontend Engineer' } })).status, 200);
    await uploadAndWait(h, alice.token);

    for (const body of [{ mode: 'trivia' }, { questionCount: 50 }, { questionCount: 0 }, { isAdmin: true }, { opportunityContext: { company: 'x'.repeat(300) } }]) {
      const res = await h.api('POST', '/interviews', { token: alice.token, json: body });
      assert.equal(res.status, 400, `rejected: ${JSON.stringify(body).slice(0, 60)}`);
      assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    }
    assert.equal((await h.api('POST', '/interviews', { json: {} })).status, 401);

    // No provider: labelled question bank, built from the user's own data
    fakeAi.questions.mode = 'unavailable';
    const started = await h.api('POST', '/interviews', { token: alice.token, json: { mode: 'mixed', questionCount: 5 } });
    assert.equal(started.status, 201);
    const sessionA = started.body.data;
    assert.equal(sessionA.questionSource, 'question_bank');
    assert.equal(sessionA.targetCareerTitle, 'Frontend Engineer', 'uses the role chosen in the profile');
    assert.equal(sessionA.questions.length, 5);
    assert.ok(sessionA.questions.some((q: any) => /React|JavaScript|HTML|CSS|Node\.js|Git/.test(q.question)), 'questions use the resume skills');
    assert.ok(sessionA.questions.every((q: any) => q.source === 'question_bank' && q.groundedIn));
    const sentToAi = fakeAi.questions.payloads.at(-1)!;
    assert.equal(sentToAi.role_title, 'Frontend Engineer');
    assert.ok(sentToAi.skills.includes('React'), 'the AI request carries the user context');
    assert.ok(sentToAi.experience.some((e: string) => /Example Co/.test(e)));

    // A second session does not repeat the first
    const again = (await h.api('POST', '/interviews', { token: alice.token, json: { mode: 'mixed', questionCount: 5 } })).body.data;
    const repeated = again.questions.filter((q: any) => sessionA.questions.some((p: any) => p.questionId === q.questionId));
    assert.equal(repeated.length, 0, 'the second session asks different questions');
    assert.deepEqual(fakeAi.questions.payloads.at(-1)!.avoid.slice(0, 5).sort(), sessionA.questions.map((q: any) => q.question).sort(),
      'earlier questions are passed to the AI as ones to avoid');

    // Provider available: its validated questions are used and labelled
    fakeAi.questions.mode = 'ok';
    fakeAi.questions.set = Array.from({ length: 6 }, (_, i) => ({
      question: `AI generated question number ${i + 1} about the candidate's React dashboards?`,
      category: i % 2 ? 'behavioral' : 'technical',
      difficulty: 'medium',
      expected_concepts: ['Concept A', 'Concept B'],
      grounded_in: 'resume skill: React'
    }));
    const aiSession = (await h.api('POST', '/interviews', { token: alice.token, json: { mode: 'technical', questionCount: 4 } })).body.data;
    assert.equal(aiSession.questionSource, 'ai');
    assert.equal(aiSession.questions.length, 4);
    assert.ok(aiSession.questions.every((q: any) => q.source === 'ai' && /^AI generated question/.test(q.question)));

    // Provider returns too few / invalid questions: fall back, never pad
    fakeAi.questions.mode = 'short';
    const shortSession = (await h.api('POST', '/interviews', { token: alice.token, json: { mode: 'technical', questionCount: 4 } })).body.data;
    assert.equal(shortSession.questionSource, 'question_bank');
    assert.equal(shortSession.questions.length, 4);
    fakeAi.questions.mode = 'ok';
    fakeAi.questions.set = fakeAi.questions.set.map(q => ({ ...q, category: 'trivia' }));
    assert.equal((await h.api('POST', '/interviews', { token: alice.token, json: { questionCount: 3 } })).body.data.questionSource, 'question_bank');
    fakeAi.questions.mode = 'unavailable';
    console.log('  ✓ Sessions: validation, labelled bank fallback, AI questions when available, no padding of bad AI output');

    // Job-specific session keeps the posting
    const jobSession = (await h.api('POST', '/interviews', {
      token: alice.token,
      json: { mode: 'mixed', questionCount: 6, opportunityContext: { title: 'Platform Engineer', company: 'Example Cloud Ltd', description: 'Needs Kubernetes, Docker and React.' } }
    })).body.data;
    assert.equal(jobSession.targetCareerTitle, 'Platform Engineer');
    assert.deepEqual(jobSession.opportunityContext, { title: 'Platform Engineer', company: 'Example Cloud Ltd' });
    assert.ok(jobSession.questions.filter((q: any) => /job posting/i.test(q.groundedIn)).length >= 3);
    assert.ok(jobSession.questions.some((q: any) => /Kubernetes|Docker/.test(q.question)), 'asks about what the posting requires');
    // A role title alone is not a job posting
    const plain = (await h.api('POST', '/interviews', { token: alice.token, json: { opportunityContext: { title: 'Frontend Engineer', company: '' } } })).body.data;
    assert.equal(plain.opportunityContext, undefined);

    // Answer, complete, then read it back through history and the report
    const sid: string = sessionA._id;
    const answer = 'In my internship the dashboard was slow. I was responsible for the React front end. I profiled renders, memoised the table and split the bundle. As a result load time fell from 6s to 2s.';
    const answered = await h.api('POST', `/interviews/${sid}/respond`, { token: alice.token, json: { questionIndex: 0, candidateResponse: answer } });
    assert.equal(answered.status, 200);
    assert.equal((await h.api('POST', `/interviews/${sid}/complete`, { token: alice.token })).status, 200);

    const history = (await h.api('GET', '/interviews/history', { token: alice.token })).body.data;
    const list: any[] = Array.isArray(history) ? history : (Object.values(history).find(Array.isArray) as any[]);
    assert.equal(list.length, 7, 'every session Alice started is in her history');
    const stored = list.find(s => s._id === sid);
    assert.equal(stored.status, 'completed');
    assert.equal(stored.questions[0].candidateResponse, answer, 'the answer is stored');
    assert.equal(stored.questionSource, 'question_bank');

    const report = (await h.api('GET', `/interviews/${sid}/report`, { token: alice.token })).body.data;
    assert.equal(report.questionSource, 'question_bank');
    assert.equal(report.evaluationSource, 'heuristic');
    assert.equal(report.answeredCount, 1);
    assert.equal(report.questionCount, 5);
    const evaluation = report.questions[0].evaluation;
    assert.equal(evaluation.source, 'heuristic');
    assert.ok(evaluation.score <= 80, 'the rule-based fallback is capped');
    for (const dimension of ['relevance', 'completeness', 'specificity', 'structure']) {
      assert.equal(typeof evaluation.dimensions[dimension], 'number', `${dimension} is reported`);
    }
    assert.equal(evaluation.dimensions.technicalAccuracy, null, 'the fallback never claims to have checked technical correctness');
    assert.equal(typeof evaluation.starFormatted, 'boolean');
    assert.ok(evaluation.feedback.length > 0);
    assert.equal(report.dimensionScores.technicalAccuracy, null);
    assert.equal((await h.api('GET', `/interviews/${sid}`, { token: alice.token })).body.data.questions[0].candidateResponse, answer);

    // Isolation
    for (const [method, path] of [['GET', `/interviews/${sid}`], ['GET', `/interviews/${sid}/report`], ['POST', `/interviews/${sid}/complete`]] as const) {
      assert.equal((await h.api(method, path, { token: bob.token })).status, 404, `Bob cannot ${method} ${path}`);
    }
    assert.equal((await h.api('POST', `/interviews/${sid}/respond`, { token: bob.token, json: { questionIndex: 1, candidateResponse: 'intrusion' } })).status, 404);
    const bobHistory = (await h.api('GET', '/interviews/history', { token: bob.token })).body.data;
    assert.equal((Array.isArray(bobHistory) ? bobHistory : (Object.values(bobHistory).find(Array.isArray) as any[])).length, 0);
    console.log('  ✓ History and report: answers, scoring source, dimensions and job context persist; other users get 404');

    console.log('✅ Interview Question Generation Tests Passed\n');
  } finally {
    fakeAi.questions.mode = 'unavailable';
    fakeAi.questions.set = [];
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runInterviewQuestionTests();
    } catch (err) {
      console.error('❌ Interview Question Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
