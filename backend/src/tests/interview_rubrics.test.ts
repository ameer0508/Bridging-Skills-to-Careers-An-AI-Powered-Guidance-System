import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { evaluateAnswer, evaluateHeuristically, HEURISTIC_MAX_SCORE } from '../services/InterviewEvaluator.js';
import { resolveRubric, RUBRIC_IDS, rubricById, RUBRICS } from '../services/interview/InterviewRubrics.js';
import interviewService from '../services/InterviewService.js';
import InterviewSession, { type IQuestionItem } from '../models/InterviewSession.js';
import { User } from '../models/User.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * D5 role-specific rubrics: valid weights, role resolution, 'general' reproducing earlier scores
 * exactly, scores that follow each rubric's weights, the same caps for every role, the AI path,
 * the rubric stored with a session (older sessions keep 'general'), and the HTTP surface.
 */

const BEHAVIOURAL: IQuestionItem = {
  questionId: 'b1',
  question: 'Tell me about a time you had to change a plan because stakeholders disagreed.',
  category: 'behavioral',
  difficulty: 'medium',
  expectedConcepts: ['Stakeholder Alignment', 'Decision', 'Outcome'],
};

const TECHNICAL: IQuestionItem = {
  questionId: 't1',
  question: 'How would you measure whether a new recommendation model improves engagement?',
  category: 'technical',
  difficulty: 'medium',
  expectedConcepts: ['A/B Testing', 'Metrics', 'Statistical Significance'],
};

// Clear STAR story, no tools, no numbers
const STAR_NO_METRICS =
  'When I was leading the onboarding redesign at my previous company, the sales and support teams disagreed about the order of the steps. ' +
  'My task was to agree a plan that both teams could accept before the release date. ' +
  'I organised a short workshop, wrote down each concern, and proposed a compromise where the support checklist came first and the sales tour came later. ' +
  'I then coordinated a review with both leads and decided to run the new order with a small group of customers first. ' +
  'As a result both teams signed off, the release went ahead on time, and the stakeholders agreed the process for the next change.';

// Numbers and named methods, little narrative structure
const METRIC_HEAVY =
  'Run an A/B test with Python and SQL: 50% control, 50% treatment, tracking click-through rate, session length and 7-day retention. ' +
  'With 20000 users per arm and a baseline CTR of 4%, a lift of 0.5 percentage points is detectable at 80% power. ' +
  'Use pandas for the analysis, report confidence intervals, and check 3 guardrail metrics such as latency in ms, errors and unsubscribes over 14 days in Tableau dashboards.';

const strip = <T extends { evaluatedAt?: Date }>(e: T) => ({ ...e, evaluatedAt: undefined });

export async function runInterviewRubricTests() {
  console.log('🧪 Running Role-Specific Interview Rubric (D5) Tests...');

  // === Definitions ==============================================================================
  for (const id of RUBRIC_IDS) {
    const r = RUBRICS[id];
    const hSum = Object.values(r.heuristic).reduce((a, b) => a + b, 0);
    const aSum = Object.values(r.ai).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(hSum - 1) < 1e-9, `${id}: rule-based weights sum to 1 (${hSum})`);
    assert.equal(aSum, 100, `${id}: AI weights sum to 100`);
    assert.equal(r.version, 1);
  }
  const expectations: Array<[string, string]> = [
    ['Software Engineer', 'software_engineering'], ['Backend Engineer', 'software_engineering'], ['Frontend Engineer', 'software_engineering'],
    ['Full Stack Developer', 'software_engineering'], ['Mobile App Developer', 'software_engineering'], ['Senior Full Stack Architect', 'software_engineering'],
    ['Data Analyst', 'data'], ['Data Scientist', 'data'], ['Machine Learning Engineer', 'data'],
    ['DevOps Engineer', 'infrastructure_security'], ['Cloud Engineer', 'infrastructure_security'], ['Cybersecurity Analyst', 'infrastructure_security'],
    ['Site Reliability Engineer', 'infrastructure_security'],
    ['Product Manager', 'product_business'], ['Business Analyst', 'product_business'],
    ['UI/UX Designer', 'design'],
    ['General Interview Practice', 'general'], ['', 'general'], ['Pastry Chef', 'general'],
  ];
  for (const [title, id] of expectations) assert.equal(resolveRubric(title).id, id, `${title || '(empty)'} → ${id}`);
  assert.equal(rubricById(undefined).id, 'general', 'older sessions without a rubric use general');
  assert.equal(rubricById('not-a-rubric').id, 'general');
  console.log(`  ✓ ${RUBRIC_IDS.length} rubrics with valid weights; ${expectations.length} role titles resolved, unknown roles → general`);

  // === General reproduces the earlier scoring exactly ===========================================
  for (const [answer, question] of [[STAR_NO_METRICS, BEHAVIOURAL], [METRIC_HEAVY, TECHNICAL], ['Too short.', TECHNICAL]] as const) {
    const before = evaluateHeuristically(answer, question);
    const general = evaluateHeuristically(answer, question, RUBRICS.general);
    assert.deepEqual(strip(general), strip(before));
    assert.equal(general.rubricId, 'general');
  }
  console.log('  ✓ The general rubric is the scoring used before rubrics existed');

  // === Scores follow each rubric's weights ======================================================
  const scores: Record<string, Record<string, number>> = { star: {}, metric: {} };
  for (const id of RUBRIC_IDS) {
    const rubric = RUBRICS[id];
    for (const [key, answer, question] of [['star', STAR_NO_METRICS, BEHAVIOURAL], ['metric', METRIC_HEAVY, TECHNICAL]] as const) {
      const e = evaluateHeuristically(answer, question, rubric);
      const d = e.dimensions!;
      const fromDims = (d.relevance * rubric.heuristic.relevance + d.completeness * rubric.heuristic.completeness + d.specificity * rubric.heuristic.specificity + d.structure * rubric.heuristic.structure);
      const words = answer.split(/\s+/).length;
      const capped = Math.min(words < 40 ? 50 : 100, HEURISTIC_MAX_SCORE);
      assert.ok(Math.abs(e.score - Math.min(capped, Math.round(fromDims))) <= 1, `${id}/${key}: score ${e.score} follows the weights (${fromDims.toFixed(1)})`);
      assert.equal(e.rubricId, id);
      scores[key][id] = e.score;
    }
  }
  assert.ok(scores.star.product_business > scores.star.data, `a structured story counts for more in product roles (${scores.star.product_business} vs ${scores.star.data})`);
  assert.ok(scores.metric.data > scores.metric.product_business, `measured detail counts for more in data roles (${scores.metric.data} vs ${scores.metric.product_business})`);
  console.log(`  ✓ Weights drive scores: STAR story product ${scores.star.product_business} vs data ${scores.star.data}; metric answer data ${scores.metric.data} vs product ${scores.metric.product_business}`);

  // === The same caps for every role ============================================================
  const offTopic = 'My favourite hobby is hiking in the mountains every weekend with friends, carrying water and snacks to the summit and back down to the village for lunch afterwards.';
  for (const id of RUBRIC_IDS) {
    assert.ok(evaluateHeuristically('I would just test it properly and see.', TECHNICAL, RUBRICS[id]).score <= 25, `${id}: one sentence capped`);
    assert.ok(evaluateHeuristically(offTopic, TECHNICAL, RUBRICS[id]).score <= 15, `${id}: off-topic capped`);
    assert.ok(evaluateHeuristically(STAR_NO_METRICS + ' ' + METRIC_HEAVY, BEHAVIOURAL, RUBRICS[id]).score <= HEURISTIC_MAX_SCORE, `${id}: rule-based maximum`);
  }
  console.log('  ✓ Short, off-topic and unverified answers are capped identically under every rubric');

  // === AI path ===================================================================================
  const fakeAi = await ensureFakeAiService();
  process.env.INTERVIEW_AI_TIMEOUT_MS = '400';
  fakeAi.interview.mode = 'ok';
  fakeAi.interview.rubric = {
    relevance: 5, completeness: 4, specificity: 4, structure: 5, technical_accuracy: 4, is_relevant: true,
    strengths: [], improvements: [], missing_concepts: [], feedback: 'ok',
  };
  const ai = async (rubricId: keyof typeof RUBRICS) => evaluateAnswer(METRIC_HEAVY + ' ' + STAR_NO_METRICS, TECHNICAL, 'x', RUBRICS[rubricId]);
  // general 25+16+16+15+16; software 20+12+16+15+24; product 25+16+12+25+12
  assert.deepEqual([(await ai('general')).score, (await ai('software_engineering')).score, (await ai('product_business')).score], [88, 87, 90]);
  fakeAi.interview.rubric = { ...fakeAi.interview.rubric, technical_accuracy: null };
  // Without accuracy, the other weights are rescaled: software (20+12+16+15)/70
  assert.equal((await ai('software_engineering')).score, 90);
  assert.equal((await ai('software_engineering')).rubricId, 'software_engineering');
  console.log('  ✓ AI rubric uses role weights, rescales when accuracy is not judged, and records the rubric');

  // === Sessions store their rubric ===========================================================
  fakeAi.interview.mode = 'unavailable';
  const user = await User.create({ email: `rubric_${Date.now()}@example.com`, passwordHash: 'x' });
  const userId = user._id.toString();
  const dataSession = await interviewService.startSession(userId, { targetCareerTitle: 'Data Analyst', mode: 'behavioral', questionCount: 2 });
  assert.deepEqual([dataSession.rubricId, dataSession.rubricVersion], ['data', 1]);
  const answered = await interviewService.respondToQuestion(userId, dataSession._id.toString(), { questionIndex: 0, candidateResponse: STAR_NO_METRICS });
  assert.equal(answered.questions[0].evaluation!.rubricId, 'data');

  const chosen = await interviewService.startSession(userId, { targetCareerTitle: 'Data Analyst', rubricId: 'design', questionCount: 1 });
  assert.equal(chosen.rubricId, 'design', 'an explicit choice overrides the role title');

  const legacy = await interviewService.startSession(userId, { targetCareerTitle: 'Data Analyst', questionCount: 1 });
  await InterviewSession.updateOne({ _id: legacy._id }, { $unset: { rubricId: 1, rubricVersion: 1 } });
  const legacyAnswered = await interviewService.respondToQuestion(userId, legacy._id.toString(), { questionIndex: 0, candidateResponse: STAR_NO_METRICS });
  assert.equal(legacyAnswered.questions[0].evaluation!.rubricId, 'general', 'a session from before rubrics is scored as it always was');
  console.log('  ✓ Sessions store the resolved or chosen rubric; older sessions keep general');

  // === HTTP ======================================================================================
  const h = await startHttpHarness();
  try {
    assert.equal((await h.api('GET', '/interviews/rubrics')).status, 401);
    const viewer = await h.registerUser('rubric-viewer');
    const list = await h.api('GET', '/interviews/rubrics', { token: viewer.token });
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.data.rubrics.map((r: { id: string }) => r.id), RUBRIC_IDS);
    assert.equal(list.body.data.resolved, 'general');
    assert.equal((await h.api('GET', '/interviews/rubrics?role=Data%20Scientist', { token: viewer.token })).body.data.resolved, 'data', 'the server says which rubric a role resolves to');
    assert.equal((await h.api('GET', '/interviews/rubrics?weights=1', { token: viewer.token })).status, 400);
    assert.equal((await h.api('POST', '/interviews', { token: viewer.token, json: { rubricId: 'astrology' } })).status, 400);
    const started = await h.api('POST', '/interviews', { token: viewer.token, json: { targetCareerTitle: 'Product Manager', questionCount: 1 } });
    assert.equal(started.body.data.rubricId, 'product_business');
    const report = await h.api('GET', `/interviews/${started.body.data._id}/report`, { token: viewer.token });
    assert.equal(report.body.data.rubric.id, 'product_business');
    assert.equal(report.body.data.rubric.ai.structure, 25);
    const other = await h.registerUser('rubric-other');
    assert.equal((await h.api('GET', `/interviews/${started.body.data._id}/report`, { token: other.token })).status, 404, "another user's report is not visible");
    console.log('  ✓ HTTP: rubric list requires sign-in, unknown rubric 400, rubric in the report, other users 404');
  } finally {
    await h.close();
  }

  delete process.env.INTERVIEW_AI_TIMEOUT_MS;
  console.log('✅ Role-Specific Interview Rubric (D5) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runInterviewRubricTests();
    } catch (err) {
      console.error('❌ Interview Rubric Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
      process.exit();
    }
  })();
}
