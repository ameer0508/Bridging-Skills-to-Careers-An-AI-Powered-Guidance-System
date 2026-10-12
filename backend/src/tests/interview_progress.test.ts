import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import InterviewSession from '../models/InterviewSession.js';
import { computeProgress, ProgressSessionInput, trendOf } from '../services/interview/InterviewProgressService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * D6 historical comparison: trends need enough sessions and a real difference, rule-based and AI
 * scores are separate series, mixed and unanswered sessions are left out, overall scores are only
 * compared within one rubric, and each user sees only their own sessions.
 */

const day = (n: number) => new Date(Date.UTC(2026, 8, n, 10));
const dims = (relevance: number, structure: number, technicalAccuracy: number | null = null) => ({
  relevance, completeness: 50, specificity: 40, structure, technicalAccuracy,
});

function session(id: string, n: number, over: Partial<ProgressSessionInput> = {}): ProgressSessionInput {
  return {
    id,
    completedAt: day(n),
    mode: 'technical',
    rubricId: 'general',
    evaluationSource: 'heuristic',
    overallScore: 50,
    answeredCount: 5,
    plannedCount: 5,
    dimensionScores: dims(50, 50),
    ...over,
  };
}

export async function runInterviewProgressTests() {
  console.log('🧪 Running Interview Progress (D6) Tests...');

  // === Trend rule ================================================================================
  assert.deepEqual([trendOf([]).reason, trendOf([50, 60]).reason, trendOf([50, 60]).latestVsPrevious], ['too_few_sessions', 'too_few_sessions', 10]);
  const up = trendOf([40, 45, 60, 70]);
  assert.deepEqual([up.earlierMean, up.recentMean, up.change, up.direction], [42.5, 65, 22.5, 'improved']);
  assert.equal(trendOf([60, 58, 61]).direction, 'no_clear_change', 'a 1-point difference is not a change');
  assert.equal(trendOf([80, 75, 62]).direction, 'declined');
  assert.equal(trendOf([50, 99, 59]).change, 9, 'the middle session is dropped for odd counts; 9 < 10 points');
  console.log('  ✓ Trend: at least 3 sessions, earlier vs recent half, 10-point threshold');

  // === Like with like ================================================================================
  const input: ProgressSessionInput[] = [
    session('h3', 9, { dimensionScores: dims(70, 75), overallScore: 64 }),
    session('h1', 1, { dimensionScores: dims(40, 30), overallScore: 38 }),
    session('h2', 5, { dimensionScores: dims(55, 50), overallScore: 52, rubricId: 'data' }),
    session('a1', 2, { evaluationSource: 'ai', dimensionScores: dims(80, 80, 60), overallScore: 78 }),
    session('a2', 6, { evaluationSource: 'ai', dimensionScores: dims(85, 80, 70), overallScore: 82 }),
    session('m1', 7, { evaluationSource: 'mixed', dimensionScores: dims(99, 99) }),
    session('z1', 8, { answeredCount: 0, evaluationSource: null }),
  ];
  const p = computeProgress(input);
  assert.equal(p.sessionsConsidered, 5);
  assert.deepEqual(p.excluded, { mixedScoring: 1, nothingAnswered: 1 });
  const heuristic = p.series.find(s => s.evaluationSource === 'heuristic')!;
  const ai = p.series.find(s => s.evaluationSource === 'ai')!;
  assert.deepEqual(heuristic.sessions.map(s => s.id), ['h1', 'h2', 'h3'], 'ordered by completion date');
  assert.deepEqual(heuristic.dimensions.structure.points.map(x => x.value), [30, 50, 75]);
  assert.equal(heuristic.dimensions.structure.trend.direction, 'improved');
  assert.equal(heuristic.dimensions.technicalAccuracy.points.length, 0, 'rule-based sessions never get an accuracy series');
  assert.equal(ai.dimensions.technicalAccuracy.points.length, 2);
  assert.equal(ai.dimensions.relevance.trend.reason, 'too_few_sessions', 'two AI sessions give no direction');
  assert.equal(ai.dimensions.relevance.trend.latestVsPrevious, 5);
  assert.ok(!heuristic.dimensions.relevance.points.some(x => x.value === 99) && !ai.dimensions.relevance.points.some(x => x.value === 99), 'mixed sessions are in no series');
  assert.deepEqual(
    heuristic.overallByRubric.map(r => [r.rubricId, r.points.map(x => x.value)]),
    [['general', [38, 64]], ['data', [52]]],
    'overall scores are grouped by rubric'
  );
  console.log('  ✓ Series: rule-based and AI apart, mixed and unanswered left out, accuracy only where judged, overall per rubric');

  // === HTTP ======================================================================================
  const h = await startHttpHarness();
  try {
    assert.equal((await h.api('GET', '/interviews/progress')).status, 401);
    const alice = await h.registerUser('progress-alice');
    const bob = await h.registerUser('progress-bob');
    const doc = (userId: string, n: number, structure: number, extra: Record<string, unknown> = {}) => ({
      userId: new mongoose.Types.ObjectId(userId),
      targetCareerTitle: 'Data Analyst',
      mode: 'technical',
      status: 'completed',
      questionCount: 3,
      currentQuestionIndex: 2,
      questions: [{ questionId: `q${n}`, question: 'Q', expectedConcepts: [] }],
      overallScore: structure - 10,
      answeredCount: 3,
      evaluationSource: 'heuristic',
      rubricId: 'data',
      dimensionScores: dims(60, structure),
      completedAt: day(n),
      ...extra,
    });
    await InterviewSession.insertMany([
      doc(alice.userId, 1, 30),
      doc(alice.userId, 3, 45),
      doc(alice.userId, 5, 70),
      doc(alice.userId, 6, 90, { mode: 'behavioral' }),
      doc(alice.userId, 7, 10, { status: 'active', completedAt: undefined }),
      doc(bob.userId, 2, 99),
    ]);
    const res = await h.api('GET', '/interviews/progress?mode=technical', { token: alice.token });
    assert.equal(res.status, 200);
    const series = res.body.data.series[0];
    assert.deepEqual(series.dimensions.structure.points.map((x: { value: number }) => x.value), [30, 45, 70], "only alice's completed technical sessions");
    assert.equal(series.dimensions.structure.trend.direction, 'improved');
    assert.equal((await h.api('GET', '/interviews/progress', { token: alice.token })).body.data.sessionsConsidered, 4, 'all modes without a filter');
    const bobView = (await h.api('GET', '/interviews/progress', { token: bob.token })).body.data;
    assert.deepEqual(bobView.series[0].dimensions.structure.points.map((x: { value: number }) => x.value), [99], 'bob sees only his own');
    assert.equal((await h.api('GET', '/interviews/progress?mode=astrology', { token: alice.token })).status, 400);
    assert.equal((await h.api('GET', '/interviews/progress?userId=x', { token: alice.token })).status, 400);
    console.log('  ✓ HTTP: own completed sessions only, mode filter, 2 invalid queries rejected');
  } finally {
    await h.close();
  }
  console.log('✅ Interview Progress (D6) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runInterviewProgressTests();
    } catch (err) {
      console.error('❌ Interview Progress Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
