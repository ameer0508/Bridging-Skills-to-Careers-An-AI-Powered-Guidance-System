import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { evaluateAnswer, evaluateHeuristically, HEURISTIC_MAX_SCORE } from '../services/InterviewEvaluator.js';
import { answerLanguage, EVALUATION_METHODS, LIMITATIONS } from '../services/interview/evaluationQuality.js';
import { CONTRADICTION_CAP, findContradictions } from '../services/interview/contradictions.js';
import interviewService from '../services/InterviewService.js';
import type { IQuestionItem } from '../models/InterviewSession.js';
import { User } from '../models/User.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';

/**
 * X9 interview scoring quality: versioned methods, transparent factors, uncertainty and limitation
 * labels on every evaluation; behaviour on empty, generic, contradictory and excellent answers;
 * stability across equivalent answers; and non-English answers left unscored instead of marked down.
 */

const Q: IQuestionItem = {
  questionId: 'rl',
  question: 'How would you design a rate limiter for a public API that must stay available under heavy load?',
  category: 'technical',
  difficulty: 'hard',
  expectedConcepts: ['Rate Limiting Algorithm', 'Distributed State', 'Failure Handling'],
};

const EXCELLENT =
  'I would use a token bucket algorithm because it allows short bursts while enforcing an average rate, whereas a fixed window lets clients double their rate at the boundary. ' +
  'Each client gets a bucket keyed by API key, and the state lives in Redis so that every API node shares the same counters; the refill and decrement run in one Lua script to stay atomic. ' +
  'For failure handling the limiter must fail open: if Redis is unreachable, nodes fall back to a small in-memory limit instead of rejecting all traffic. ' +
  'The trade-off is slightly less accurate limits during a partition. ' +
  'First I would return 429 with a Retry-After header, then add per-endpoint limits, and finally expose metrics such as rejected requests per second; a typical starting point is 100 requests per minute per key.';
// Below the rule-based cap, so changes in wording can show up in the score
const MEDIUM =
  'I would put a token bucket in front of the API so that each client has a limit, and keep the counters in Redis so all servers agree. ' +
  'If Redis fails the limiter should fail open so the API stays available. ' +
  'I would return 429 to clients that go over the limit and watch the rejected request rate.';
const GENERIC = 'I would follow best practices, keep it scalable and robust, and test it well with my team before release.';
const CONTRADICTORY =
  'I would always use a token bucket algorithm for the rate limiter because it handles bursts, and I would never use a token bucket because it cannot handle bursts. ' +
  'The state would live in Redis shared by every node, but each node would also keep its own separate limits with no shared state at all. ' +
  'For failure handling it must fail open so traffic continues, and it must also fail closed so that no request passes when Redis is down. ' +
  'I would return 429 to throttled clients, which is how the design keeps the public API available under heavy load.';

const sentences = (s: string) => s.match(/[^.;]+[.;]/g)!.map(x => x.trim());

export async function runInterviewQualityTests() {
  console.log('🧪 Running Interview Scoring Quality (X9) Tests...');

  // === Categories ===================================================================================
  const empty = evaluateHeuristically('', Q);
  const generic = evaluateHeuristically(GENERIC, Q);
  const contradictory = evaluateHeuristically(CONTRADICTORY, Q);
  const excellent = evaluateHeuristically(EXCELLENT, Q);
  assert.deepEqual([empty.score, empty.method, empty.uncertainty?.level], [0, EVALUATION_METHODS.empty, 'low']);
  assert.ok(generic.score <= 25 && generic.uncertainty?.level === 'high', `generic answer ${generic.score}, ${generic.uncertainty?.level}`);
  assert.ok((generic.factors as { capsApplied: string[] }).capsApplied.length > 0, 'the cap that applied is named');
  assert.ok(excellent.score >= 60 && excellent.score <= HEURISTIC_MAX_SCORE, `excellent answer ${excellent.score}`);
  assert.equal(excellent.uncertainty?.level, 'medium', 'rule-based scoring is never low-uncertainty');
  const factors = excellent.factors as { specificity: { technologies: string[]; metrics: string[] }; relevance: { conceptsCovered: string[] } };
  assert.ok(factors.specificity.technologies.includes('Redis') && factors.specificity.metrics.length > 0, 'the tools and numbers that earned specificity are listed');
  assert.ok(factors.relevance.conceptsCovered.includes('Failure Handling'));
  assert.ok(empty.score < generic.score && generic.score < excellent.score, 'empty < generic < excellent');
  // Explicit contradictions are found and capped; subtler ones are still a stated limitation
  assert.ok(contradictory.limitations?.includes(LIMITATIONS.noContradictions));
  assert.ok(contradictory.score <= CONTRADICTION_CAP, `the contradictory answer is capped (${contradictory.score})`);
  assert.ok((contradictory.factors as { contradictions: unknown[] }).contradictions.length >= 2, 'the conflicting statements are listed');
  assert.ok((contradictory.factors as { capsApplied: string[] }).capsApplied.includes('it contradicts itself'));
  assert.equal(contradictory.uncertainty?.level, 'high');
  assert.match(contradictory.improvements[0], /^Resolve the contradiction: "I would always use a token bucket/);
  for (const e of [generic, contradictory, excellent]) {
    assert.equal(e.method, EVALUATION_METHODS.heuristic);
    assert.ok(e.limitations?.includes(LIMITATIONS.notHiringPrediction) && e.limitations?.includes(LIMITATIONS.noFactCheck));
  }
  console.log(`  ✓ Categories: empty ${empty.score}, generic ${generic.score}, contradictory ${contradictory.score} (limitation stated), excellent ${excellent.score}; factors, method and uncertainty on each`);

  // === Contradictions: counterfactual and adversarial ================================================
  // Counterfactual: the same excellent answer with one sentence that denies its own claim
  const withDenial = `${EXCELLENT} However, I would never use a token bucket algorithm.`;
  const denied = evaluateHeuristically(withDenial, Q);
  assert.ok(denied.score <= CONTRADICTION_CAP, `adding a self-denial caps the excellent answer (${excellent.score} -> ${denied.score})`);
  assert.equal(evaluateHeuristically(withDenial.replace(' However, I would never use a token bucket algorithm.', ''), Q).score, excellent.score, 'removing it restores the score exactly');
  const failBoth = `${EXCELLENT} The limiter must also fail closed so that nothing passes.`;
  assert.ok(evaluateHeuristically(failBoth, Q).score <= CONTRADICTION_CAP, 'fail open and fail closed asserted together');
  // A conditional claim is not compared: MEDIUM fails open only "if Redis fails" (a stated limitation)
  assert.deepEqual(findContradictions(`${MEDIUM} The limiter must also fail closed so that nothing passes.`), []);
  // Each planted contradiction on its own is enough, and removing all of them lifts the cap
  const resolved = CONTRADICTORY
    .replace(', and I would never use a token bucket because it cannot handle bursts', '')
    .replace(', but each node would also keep its own separate limits with no shared state at all', '')
    .replace(', and it must also fail closed so that no request passes when Redis is down', '');
  const resolvedEval = evaluateHeuristically(resolved, Q);
  assert.deepEqual(findContradictions(resolved), []);
  assert.ok(resolvedEval.score > CONTRADICTION_CAP, `with the contradictions removed the answer is scored normally (${resolvedEval.score})`);
  // Adversarial: wording that negates, contrasts or qualifies without contradicting must not be capped
  const legitimate: Record<string, string> = {
    'conditional advice': 'Use caching when data is read-heavy. Do not use caching when data changes constantly. I would measure hit rates.',
    "someone else's view": 'Some people use a fixed window for rate limiting. I would not use a fixed window for rate limiting because bursts at the boundary double the rate.',
    'scoped exception': 'I would use a token bucket for the public API. I would not use a token bucket for internal traffic between services.',
    'rejected alternative': 'I would not use a fixed window counter. I would use a sliding log or a token bucket in Redis.',
    'different conditions': 'If Redis is down the limiter should fail open. If the auth service is down the gateway should fail closed.',
    'opposite option discussed': 'The limiter should fail open. Failing closed would reject all traffic, which is worse for availability.',
    'different subjects': 'The API servers stay stateless and the state lives in Redis. Redis is not stateless, so it needs replication.',
    'behavioural negatives': 'When our deploys kept failing I was responsible for the pipeline. I did not blame the team; I added tests and the failures dropped from 12 to 2 per month. We did not ship broken builds after that.',
    'repeated negative': 'I would never store passwords in plain text. Passwords must never be stored in plain text, so I hash them with bcrypt.',
    'not only, also': 'Rate limiting is not only about blocking abuse. Rate limiting is also about fairness between clients.',
    'excellent': EXCELLENT,
    'medium': MEDIUM,
  };
  for (const [label, text] of Object.entries(legitimate)) {
    assert.deepEqual(findContradictions(text), [], `not a contradiction: ${label}`);
  }
  // The AI path gets the same guard rail, whatever the model returned
  const aiFake = await ensureFakeAiService();
  process.env.INTERVIEW_AI_TIMEOUT_MS = '400';
  aiFake.interview.mode = 'ok';
  aiFake.interview.rubric = { relevance: 5, completeness: 5, specificity: 5, structure: 5, technical_accuracy: 5, is_relevant: true, strengths: [], improvements: [], missing_concepts: [], feedback: 'ok' };
  const aiContradictory = await evaluateAnswer(CONTRADICTORY, Q, 'Backend Engineer');
  assert.equal(aiContradictory.method, EVALUATION_METHODS.ai);
  assert.ok(aiContradictory.score <= CONTRADICTION_CAP, `an AI score of 100 is capped for a contradictory answer (${aiContradictory.score})`);
  assert.equal((await evaluateAnswer(EXCELLENT, Q, 'Backend Engineer')).score, 100, 'and left alone otherwise');
  aiFake.interview.mode = 'unavailable';
  delete process.env.INTERVIEW_AI_TIMEOUT_MS;
  console.log(`  ✓ Contradictions: one planted denial caps ${excellent.score} -> ${denied.score} and removing it restores ${excellent.score}; resolved answer ${resolvedEval.score}; ${Object.keys(legitimate).length} legitimate negations and contrasts not flagged; AI path capped too`);

  // === Stability across equivalent answers ===========================================================
  const variantsOf = (base: string): Record<string, string> => {
    const parts = sentences(base);
    return {
      'extra whitespace and line breaks': base.replace(/ /g, '  ').replace(/\. /g, '.\n\n'),
      'upper case': base.toUpperCase(),
      'different punctuation': base.replace(/;/g, '.').replace(/,/g, ''),
      'sentences reordered': [...parts.slice(Math.ceil(parts.length / 2)), ...parts.slice(0, Math.ceil(parts.length / 2))].join(' '),
      'bulleted': parts.map(x => `- ${x}`).join('\n'),
    };
  };
  const medium = evaluateHeuristically(MEDIUM, Q);
  assert.ok(medium.score > 30 && medium.score < HEURISTIC_MAX_SCORE, `the medium answer is below the cap (${medium.score})`);
  for (const [label, base, baseScore] of [['excellent (at the cap)', EXCELLENT, excellent.score], ['medium (below the cap)', MEDIUM, medium.score]] as const) {
    const scores: Record<string, number> = {};
    for (const [name, text] of Object.entries(variantsOf(base))) scores[name] = evaluateHeuristically(text, Q).score;
    const all = [...Object.values(scores), baseScore];
    const spread = Math.max(...all) - Math.min(...all);
    console.log(`    stability, ${label}, base ${baseScore}: ${Object.entries(scores).map(([k, v]) => `${k} ${v}`).join(', ')}; spread ${spread}`);
    assert.equal(scores['extra whitespace and line breaks'], baseScore, `${label}: whitespace does not change the score`);
    assert.equal(scores['sentences reordered'], baseScore, `${label}: sentence order does not change the score`);
    assert.equal(scores['bulleted'], baseScore, `${label}: bullets do not change the score`);
    assert.ok(spread <= 10, `${label}: equivalent answers stay within 10 points (spread ${spread})`);
  }
  console.log('  ✓ Stability: whitespace, order and bullets change nothing; case and punctuation stay within 10 points, below and at the cap');

  // === Language ======================================================================================
  assert.equal(answerLanguage(EXCELLENT).english, true);
  assert.equal(answerLanguage('I worked with Priya Sharma on the Pune payments team and we shipped the limiter together.').english, true, 'Indian names in an English answer are fine');
  const hindi = evaluateHeuristically('मैं टोकन बकेट एल्गोरिद्म का उपयोग करूँगा क्योंकि यह अचानक बढ़े ट्रैफ़िक को संभालता है और Redis में साझा स्थिति रखूँगा।', Q);
  assert.deepEqual([hindi.notScored, hindi.method, hindi.dimensions], [true, EVALUATION_METHODS.language, undefined]);
  assert.match(hindi.feedback, /^Not scored/);
  const spanish = await evaluateAnswer('Usaría un algoritmo de cubeta de fichas para el limitador, con el estado en Redis para que todos los nodos compartan los contadores y con una respuesta 429 para los clientes que superan el límite de la API.', Q, 'Backend Engineer');
  assert.equal(spanish.notScored, true, 'Spanish is not marked down as off-topic');
  console.log('  ✓ Language: Hindi and Spanish answers are not scored (instead of a misleading off-topic score); English with Indian names is scored');

  // === Sessions =====================================================================================
  const fakeAi = await ensureFakeAiService();
  fakeAi.interview.mode = 'unavailable';
  const user = await User.create({ email: `x9_${Date.now()}@example.com`, passwordHash: 'x' });
  const userId = user._id.toString();
  const session = await interviewService.startSession(userId, { targetCareerTitle: 'Backend Engineer', questionCount: 3, adaptiveFollowUps: true });
  const sid = session._id.toString();
  const after = await interviewService.respondToQuestion(userId, sid, { questionIndex: 0, candidateResponse: 'मैंने इस समस्या पर टीम के साथ काम किया और एक भरोसेमंद समाधान बनाया जो भारी ट्रैफ़िक में भी चलता रहा।' });
  assert.equal(after.questions.filter(q => q.followUpOf).length, 0, 'no follow-up for an unscored answer');
  await interviewService.respondToQuestion(userId, sid, { questionIndex: 1, candidateResponse: EXCELLENT });
  const done = await interviewService.completeSession(userId, sid);
  const scored = done.questions.filter(q => !q.followUpOf && q.evaluation && !q.evaluation.notScored);
  const planned = done.questions.filter(q => !q.followUpOf).length;
  assert.equal(done.notScoredCount, 1);
  assert.equal(done.overallScore, Math.round(scored.reduce((a, q) => a + q.evaluation!.score, 0) / (planned - 1)), 'the unscored answer is out of the total and the count');
  assert.ok(done.preparationRecommendations.some(a => /not in English and could not be scored/.test(a)));
  console.log(`  ✓ Session: 1 unscored answer excluded from the overall ${done.overallScore}, explained, and not followed up`);

  // === AI path labels ==============================================================================
  process.env.INTERVIEW_AI_TIMEOUT_MS = '400';
  fakeAi.interview.mode = 'ok';
  fakeAi.interview.rubric = { relevance: 5, completeness: 4, specificity: 4, structure: 5, technical_accuracy: 4, is_relevant: true, strengths: [], improvements: [], missing_concepts: [], feedback: 'ok' };
  const ai = await evaluateAnswer(EXCELLENT, Q, 'Backend Engineer');
  assert.equal(ai.method, EVALUATION_METHODS.ai);
  assert.deepEqual((ai.factors as { rubricScoresOutOf5: Record<string, number> }).rubricScoresOutOf5.relevance, 5);
  assert.equal(ai.uncertainty?.level, 'medium');
  assert.ok(ai.limitations?.includes(LIMITATIONS.aiSingleJudge) && ai.limitations?.includes(LIMITATIONS.notHiringPrediction));
  delete process.env.INTERVIEW_AI_TIMEOUT_MS;
  console.log(`  ✓ AI path: method ${EVALUATION_METHODS.ai}, raw rubric scores as factors, uncertainty and limitations stated`);
  console.log('✅ Interview Scoring Quality (X9) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runInterviewQualityTests();
    } catch (err) {
      console.error('❌ Interview Quality Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
      process.exit();
    }
  })();
}
