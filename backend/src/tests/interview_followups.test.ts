import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { buildFollowUp, followUpReason, MAX_FOLLOW_UPS_PER_SESSION, recovered } from '../services/interview/FollowUpService.js';
import interviewService from '../services/InterviewService.js';
import type { IQuestionEvaluation, IQuestionItem } from '../models/InterviewSession.js';
import { User } from '../models/User.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * D3 adaptive follow-ups: the reason comes from what the answer lacked, the question is written
 * from it deterministically, it is asked right after the answer (opt-in, one per question, at most
 * three per session), and it is reported separately so the overall score is unchanged by it.
 */

const Q: IQuestionItem = {
  questionId: 'q-cache',
  question: 'How would you add caching to a slow API?',
  category: 'technical',
  difficulty: 'medium',
  expectedConcepts: ['Cache Invalidation', 'Hit Rate'],
  candidateResponse: 'some answer',
};

const evaluation = (over: Partial<IQuestionEvaluation>): IQuestionEvaluation => ({
  score: 50,
  starFormatted: false,
  strengths: [],
  improvements: [],
  missingConcepts: [],
  feedback: '',
  dimensions: { relevance: 60, completeness: 60, specificity: 60, structure: 60, technicalAccuracy: null },
  evaluatedAt: new Date(),
  ...over,
});

// Long enough to escape the length caps, but names none of the expected concepts
const VAGUE =
  'I would approach this carefully, think about what the team needs, talk to the people involved, and make sure that whatever we build is reliable. ' +
  'I would test it properly, review it with colleagues and keep improving it over time until everyone is happy with how it works in practice.';

export async function runInterviewFollowUpTests() {
  console.log('🧪 Running Adaptive Follow-up (D3) Tests...');

  // === Reasons and wording =======================================================================
  assert.deepEqual(followUpReason(Q, evaluation({ missingConcepts: ['Cache Invalidation', 'Hit Rate'] })), { type: 'missing_concept', concept: 'Cache Invalidation' });
  assert.equal(followUpReason(Q, evaluation({ score: 80 })), null, 'a strong answer with nothing missing gets no follow-up');
  assert.deepEqual(followUpReason(Q, evaluation({ dimensions: { relevance: 60, completeness: 60, specificity: 20, structure: 60, technicalAccuracy: null } })), { type: 'low_specificity' });
  assert.deepEqual(followUpReason(Q, evaluation({ dimensions: { relevance: 60, completeness: 60, specificity: 60, structure: 30, technicalAccuracy: null } })), { type: 'weak_structure' });
  assert.equal(followUpReason({ ...Q, candidateResponse: '  ' }, evaluation({ missingConcepts: ['Hit Rate'] })), null, 'no follow-up for an empty answer');
  assert.equal(followUpReason({ ...Q, followUpOf: 'x' }, evaluation({ missingConcepts: ['Hit Rate'] })), null, 'follow-ups do not spawn follow-ups');

  const fu = buildFollowUp(Q, { type: 'missing_concept', concept: 'Cache Invalidation' }, 2);
  assert.deepEqual([fu.questionId, fu.followUpOf, fu.source, fu.expectedConcepts], ['q-cache-followup', 'q-cache', 'follow_up', ['Cache Invalidation']]);
  assert.match(fu.question, /did not cover cache invalidation/);
  assert.match(fu.groundedIn!, /question 2 did not cover "Cache Invalidation"/);
  assert.match(buildFollowUp({ ...Q, category: 'behavioral' }, { type: 'weak_structure' }, 1).question, /situation.*responsible.*result/);
  assert.match(buildFollowUp(Q, { type: 'low_specificity' }, 1).question, /specific technologies/);

  assert.equal(recovered({ ...fu, evaluation: evaluation({ missingConcepts: [] }) }), true);
  assert.equal(recovered({ ...fu, evaluation: evaluation({ missingConcepts: ['Cache Invalidation'] }) }), false);
  assert.equal(recovered(fu), null, 'unanswered: not known');
  console.log('  ✓ Reasons in order (missing concept, specificity, structure), deterministic wording, recovery check');

  // === Sessions ===================================================================================
  const fakeAi = await ensureFakeAiService();
  fakeAi.interview.mode = 'unavailable';
  const user = await User.create({ email: `followup_${Date.now()}@example.com`, passwordHash: 'x' });
  const userId = user._id.toString();

  const off = await interviewService.startSession(userId, { targetCareerTitle: 'Backend Engineer', mode: 'technical', questionCount: 3 });
  const offAnswered = await interviewService.respondToQuestion(userId, off._id.toString(), { questionIndex: 0, candidateResponse: VAGUE });
  assert.equal(offAnswered.questions.length, 3, 'without opting in, no follow-up is added');

  const on = await interviewService.startSession(userId, { targetCareerTitle: 'Backend Engineer', mode: 'technical', questionCount: 5, adaptiveFollowUps: true });
  const sid = on._id.toString();
  const original = on.questions[0];
  assert.ok(original.expectedConcepts.length > 0, 'bank questions carry expected concepts');
  let s = await interviewService.respondToQuestion(userId, sid, { questionIndex: 0, candidateResponse: VAGUE });
  assert.equal(s.questions.length, 6);
  const followUp = s.questions[1];
  assert.deepEqual([followUp.followUpOf, followUp.source, followUp.followUpReason?.type], [original.questionId, 'follow_up', 'missing_concept']);
  assert.equal(s.currentQuestionIndex, 1, 'the follow-up is asked next');

  // Answering the original again does not add a second follow-up
  s = await interviewService.respondToQuestion(userId, sid, { questionIndex: 0, candidateResponse: VAGUE });
  assert.equal(s.questions.filter(q => q.followUpOf === original.questionId).length, 1);

  // Answer the follow-up covering the concept it asks about
  const concept = followUp.followUpReason!.concept!;
  const covering = `${concept} matters here because it decides correctness. I would handle ${concept.toLowerCase()} explicitly, for example with versioned keys, and measure it with a dashboard, since without ${concept.toLowerCase()} the system silently serves wrong results to users under load.`;
  s = await interviewService.respondToQuestion(userId, sid, { questionIndex: 1, candidateResponse: covering });
  assert.equal(s.questions.length, 6, 'a follow-up answer does not spawn another');
  assert.equal(recovered(s.questions[1]), true, 'the missing concept is covered now');

  // Weak answers to the rest: the session cap stops at three follow-ups
  for (let i = 0; i < 12 && i < s.questions.length; i++) {
    if (s.questions[i].followUpOf || s.questions[i].candidateResponse) continue;
    s = await interviewService.respondToQuestion(userId, sid, { questionIndex: i, candidateResponse: VAGUE });
  }
  const followUps = s.questions.filter(q => q.followUpOf);
  assert.equal(followUps.length, MAX_FOLLOW_UPS_PER_SESSION);
  assert.equal(s.questions.filter(q => !q.followUpOf).length, 5, 'the five planned questions are all still there');
  console.log(`  ✓ Session: opt-in only, inserted right after the answer, one per question, capped at ${MAX_FOLLOW_UPS_PER_SESSION}`);

  const done = await interviewService.completeSession(userId, sid);
  const primary = done.questions.filter(q => !q.followUpOf);
  const expected = Math.round(primary.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0) / primary.length);
  assert.equal(done.overallScore, expected, 'the overall score covers the planned questions only');
  assert.equal(done.answeredCount, 5);
  assert.deepEqual([done.followUpSummary?.asked, done.followUpSummary?.answered, done.followUpSummary?.recovered], [3, 1, 1]);
  assert.ok(done.preparationRecommendations.some(a => /recovered the missing point in 1 of 1/.test(a)));
  console.log(`  ✓ Report: overall ${done.overallScore} from planned questions; follow-ups 3 asked, 1 answered, 1 recovered`);

  // === HTTP ======================================================================================
  const h = await startHttpHarness();
  try {
    const a = await h.registerUser('followup-a');
    const b = await h.registerUser('followup-b');
    assert.equal((await h.api('POST', '/interviews', { token: a.token, json: { adaptiveFollowUps: 'yes' } })).status, 400);
    const started = await h.api('POST', '/interviews', { token: a.token, json: { targetCareerTitle: 'Data Analyst', questionCount: 2, adaptiveFollowUps: true } });
    assert.equal(started.body.data.adaptiveFollowUps, true);
    const id = started.body.data._id;
    const answered = await h.api('POST', `/interviews/${id}/respond`, { token: a.token, json: { questionIndex: 0, candidateResponse: VAGUE } });
    assert.equal(answered.body.data.questions[1].source, 'follow_up');
    assert.equal((await h.api('POST', `/interviews/${id}/respond`, { token: b.token, json: { questionIndex: 1, candidateResponse: 'x y z' } })).status, 404, "another user cannot answer the follow-up");
    await h.api('POST', `/interviews/${id}/complete`, { token: a.token });
    const report = await h.api('GET', `/interviews/${id}/report`, { token: a.token });
    assert.deepEqual([report.body.data.adaptiveFollowUps, report.body.data.followUpSummary.asked], [true, 1]);
    console.log('  ✓ HTTP: opt-in validated, follow-up returned with the answer, other users 404, summary in the report');
  } finally {
    await h.close();
  }
  console.log('✅ Adaptive Follow-up (D3) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runInterviewFollowUpTests();
    } catch (err) {
      console.error('❌ Follow-up Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
      process.exit();
    }
  })();
}
