import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  evaluateAnswer,
  evaluateHeuristically,
  HEURISTIC_MAX_SCORE
} from '../services/InterviewEvaluator.js';
import interviewService from '../services/InterviewService.js';
import RecommendationEngine from '../services/RecommendationEngine.js';
import { Recommendation } from '../models/Recommendation.js';
import { User } from '../models/User.js';
import type { IQuestionItem } from '../models/InterviewSession.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';

const TECHNICAL: IQuestionItem = {
  questionId: 't1',
  question: 'How would you design a rate limiter for a public API that must stay available under heavy load?',
  category: 'technical',
  difficulty: 'hard',
  expectedConcepts: ['Rate Limiting Algorithm', 'Distributed State', 'Failure Handling']
};

const BEHAVIOURAL: IQuestionItem = {
  questionId: 'b1',
  question: 'Describe a challenging production incident you handled and what the outcome was.',
  category: 'behavioral',
  difficulty: 'medium',
  expectedConcepts: ['Incident Diagnosis', 'Communication', 'Measured Outcome']
};

const ANSWERS = {
  empty: '   ',
  oneSentenceGeneric: 'I would use caching and make it scalable and fault tolerant.',
  // The exact answer that scored 90 under the old keyword scorer
  oldNinety:
    'I designed a cached, rate limited API for scalability and fault tolerance, which reduced latency by 40%.',
  irrelevant:
    'My favourite hobby is hiking in the mountains every weekend with friends. We usually start early in the morning, carry plenty of water and snacks, and try to reach the summit before noon so that we can enjoy the view and take photographs before walking back down to the village for lunch.',
  strongStar:
    'When I was on call at my previous company, our checkout service started returning errors during a sale and the situation was getting worse every minute. ' +
    'My task was to restore the service and I was responsible for coordinating the incident. ' +
    'I investigated the logs and metrics, found that a new Redis connection pool setting was exhausting connections, and I rolled back the change. ' +
    'I then added an alert on pool saturation and wrote a short incident report for the team so that everyone understood the diagnosis. ' +
    'As a result the error rate dropped from 18% to under 1% within 10 minutes, and the same incident has not recurred in the six months since. ' +
    'I also kept support and the product manager informed every few minutes, which reduced duplicate tickets.',
  goodTechnicalNoStar:
    'I would use a token bucket algorithm because it allows short bursts while enforcing an average rate, whereas a fixed window lets clients double their rate at the boundary. ' +
    'Each client gets a bucket keyed by API key, and the state lives in Redis so that every API node shares the same counters; the refill and decrement run in one Lua script to stay atomic. ' +
    'For failure handling the limiter must fail open: if Redis is unreachable, nodes fall back to a small in-memory limit instead of rejecting all traffic, otherwise the limiter itself becomes the outage. ' +
    'The trade-off is slightly less accurate limits during a partition. ' +
    'First I would return 429 with a Retry-After header, then add per-endpoint limits, and finally expose metrics such as rejected requests per second so the limits can be tuned; a typical starting point is 100 requests per minute per key.'
};

export async function runInterviewEvaluationTests() {
  console.log('🧪 Running Interview Evaluation Tests...');
  const fakeAi = await ensureFakeAiService();
  process.env.INTERVIEW_AI_TIMEOUT_MS = '400';

  // === Rule-based rubric (AI unavailable) ====================================
  const empty = evaluateHeuristically(ANSWERS.empty, TECHNICAL);
  assert.equal(empty.score, 0, 'an empty answer scores zero');
  assert.match(empty.feedback, /No answer was given/);

  const oneSentence = evaluateHeuristically(ANSWERS.oneSentenceGeneric, TECHNICAL);
  assert.ok(oneSentence.score <= 25, `a one-sentence generic answer is capped (${oneSentence.score})`);

  const oldNinety = evaluateHeuristically(ANSWERS.oldNinety, TECHNICAL);
  assert.ok(oldNinety.score <= 50, `the answer that used to score 90 no longer does (${oldNinety.score})`);
  assert.match(oldNinety.feedback, /limited because/);

  const irrelevant = evaluateHeuristically(ANSWERS.irrelevant, TECHNICAL);
  assert.ok(irrelevant.score <= 15, `a long but off-topic answer scores low (${irrelevant.score})`);
  assert.match(irrelevant.feedback, /does not address the question/);

  const keywordStuffed = evaluateHeuristically(
    'Rate limiting algorithm distributed state failure handling rate limiter public API heavy load available.',
    TECHNICAL
  );
  assert.ok(keywordStuffed.score <= 25, `listing keywords without substance is not rewarded (${keywordStuffed.score})`);

  const star = evaluateHeuristically(ANSWERS.strongStar, BEHAVIOURAL);
  assert.ok(star.score >= 65, `a strong STAR answer scores well (${star.score})`);
  assert.equal(star.starFormatted, true);
  assert.ok(star.strengths.some(s => /measured results/.test(s)));

  const technical = evaluateHeuristically(ANSWERS.goodTechnicalNoStar, TECHNICAL);
  assert.ok(technical.score >= 65, `a good technical answer scores well without STAR (${technical.score})`);
  assert.equal(technical.starFormatted, false);
  assert.ok(!technical.improvements.some(i => /STAR/.test(i)), 'STAR is not demanded of technical answers');

  for (const result of [star, technical]) {
    assert.ok(result.score <= HEURISTIC_MAX_SCORE, 'the rule-based rubric never awards a top score');
    assert.equal(result.source, 'heuristic');
    assert.equal(result.dimensions?.technicalAccuracy, null, 'it does not claim to judge correctness');
    assert.match(result.feedback, /cannot verify technical correctness/);
  }
  assert.ok(star.score > oldNinety.score && technical.score > oneSentence.score, 'substance outranks brevity');
  console.log(
    `  ✓ Rule-based rubric: empty ${empty.score}, one sentence ${oneSentence.score}, former-90 answer ${oldNinety.score}, ` +
      `off-topic ${irrelevant.score}, keyword list ${keywordStuffed.score}, STAR ${star.score}, technical ${technical.score}`
  );

  // === AI rubric ==============================================================
  fakeAi.interview.mode = 'ok';
  fakeAi.interview.rubric = {
    relevance: 5, completeness: 4, specificity: 4, structure: 5, technical_accuracy: 4, is_relevant: true,
    strengths: ['Explains why token bucket suits bursty traffic.'],
    improvements: ['Quantify the Redis round-trip cost.'],
    missing_concepts: [],
    feedback: 'Solid design with clear trade-offs.'
  };
  const ai = await evaluateAnswer(ANSWERS.goodTechnicalNoStar, TECHNICAL, 'Backend Engineer');
  assert.equal(ai.source, 'ai');
  // 25 + 16 + 16 + 15 + 16 = 88
  assert.equal(ai.score, 88);
  assert.equal(ai.dimensions?.technicalAccuracy, 80);
  assert.equal(ai.feedback, 'Solid design with clear trade-offs.');

  // Guard rails hold even if the model is over-generous
  fakeAi.interview.rubric = { ...fakeAi.interview.rubric, relevance: 5, completeness: 5, specificity: 5, structure: 5, technical_accuracy: 5 };
  const generousShort = await evaluateAnswer(ANSWERS.oneSentenceGeneric, TECHNICAL, 'Backend Engineer');
  assert.equal(generousShort.source, 'ai');
  assert.ok(generousShort.score <= 30, `a one-sentence answer cannot get an excellent AI score (${generousShort.score})`);
  fakeAi.interview.rubric = { ...fakeAi.interview.rubric, is_relevant: false, relevance: 0 };
  const offTopicAi = await evaluateAnswer(ANSWERS.irrelevant, TECHNICAL, 'Backend Engineer');
  assert.ok(offTopicAi.score <= 20, `an off-topic answer is capped under AI scoring (${offTopicAi.score})`);

  // An empty answer never reaches the AI at all
  const before = fakeAi.requests.filter(r => r.endsWith('/interview/evaluate')).length;
  assert.equal((await evaluateAnswer('', TECHNICAL, 'Backend Engineer')).score, 0);
  assert.equal(fakeAi.requests.filter(r => r.endsWith('/interview/evaluate')).length, before);
  console.log(`  ✓ AI rubric: validated structured output (${ai.score}), guard rails for short and off-topic answers`);

  // === Fallback behaviour =====================================================
  fakeAi.interview.mode = 'unavailable';
  const unavailable = await evaluateAnswer(ANSWERS.goodTechnicalNoStar, TECHNICAL, 'Backend Engineer');
  assert.equal(unavailable.source, 'heuristic', 'provider unavailable -> labelled rule-based result');
  assert.equal(unavailable.score, technical.score);

  fakeAi.interview.mode = 'invalid';
  const invalid = await evaluateAnswer(ANSWERS.goodTechnicalNoStar, TECHNICAL, 'Backend Engineer');
  assert.equal(invalid.source, 'heuristic', 'malformed AI output is rejected, not trusted');
  assert.notEqual(invalid.score, 99);

  fakeAi.interview.mode = 'slow';
  const started = Date.now();
  const timedOut = await evaluateAnswer(ANSWERS.goodTechnicalNoStar, TECHNICAL, 'Backend Engineer');
  assert.equal(timedOut.source, 'heuristic', 'AI timeout -> labelled rule-based result');
  assert.ok(Date.now() - started < 1400, 'the timeout is enforced');
  console.log('  ✓ Fallback: provider unavailable, invalid output and timeout all yield a labelled rule-based score');

  // === Sessions, reports and feedback into recommendations ====================
  fakeAi.interview.mode = 'unavailable';
  const user = await User.create({ email: `interview_${Date.now()}@example.com`, passwordHash: 'x' });
  const userId = user._id.toString();

  const session = await interviewService.startSession(userId, {
    mode: 'behavioral',
    questionCount: 4,
    opportunityContext: { title: 'Site Reliability Engineer', company: 'Example Co' }
  });
  assert.equal(session.targetCareerTitle, 'Site Reliability Engineer', 'job-based preparation keeps the job context');
  assert.equal(new Set(session.questions.map(q => q.questionId)).size, session.questions.length, 'no duplicate questions');
  assert.ok(!session.questions.some(q => /Tech Corp|distributed caching, CI\/CD automation|verified skills/.test(q.question)),
    'questions do not reference skills or employers the candidate does not have');
  assert.match(session.questions[0].question, /Example Co|production/);

  const sid = session._id.toString();
  await interviewService.respondToQuestion(userId, sid, { questionIndex: 0, candidateResponse: ANSWERS.strongStar });
  const done = await interviewService.completeSession(userId, sid);

  assert.equal(done.answeredCount, 1);
  const answeredScore = done.questions[0].evaluation!.score;
  assert.equal(done.overallScore, Math.round(answeredScore / 4), 'unanswered questions count as zero');
  assert.equal(done.evaluationSource, 'heuristic');
  assert.equal(done.dimensionScores?.technicalAccuracy, null, 'no invented technical-accuracy score');
  assert.equal(typeof done.dimensionScores?.structure, 'number');
  assert.ok(done.preparationRecommendations.some(a => /3 of 4 were left unanswered/.test(a)));
  assert.ok(!done.preparationRecommendations.some(a => /35% latency/.test(a)), 'no canned advice');

  // Interview weaknesses feed recommendations only once the user has a career context
  await RecommendationEngine.generateForUser(userId);
  assert.equal(await Recommendation.countDocuments({ userId: user._id }), 0, 'no career evidence -> no recommendations');
  console.log(`  ✓ Session: 1 of 4 answered -> overall ${done.overallScore} (answer scored ${answeredScore}); report derived from results`);

  delete process.env.INTERVIEW_AI_TIMEOUT_MS;
  console.log('✅ Interview Evaluation Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runInterviewEvaluationTests();
    } catch (err) {
      console.error('❌ Interview Evaluation Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
