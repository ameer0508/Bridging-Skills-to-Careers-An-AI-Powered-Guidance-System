import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EXAMS, GATE_CS_2026, SSC_CGL_2026_TIER1, topicsOf } from '../seed/exams/examDefinitions.js';
import ExamPracticeService, { QUESTIONS, QUESTIONS_BY_ID, questionsFor } from '../services/exams/ExamPracticeService.js';
import { isCorrect, markQuestion, responseProblem } from '../services/exams/examScoring.js';
import { buildPlan, recommend, topicStatus, aggregateTopics } from '../services/exams/ExamStudyService.js';
import ExamAttempt from '../models/ExamAttempt.js';
import UserSkill from '../models/UserSkill.js';
import type { PracticeQuestion } from '../seed/exams/questionTypes.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * E2/E3/E4 exam pilots: sourced definitions, a valid bank whose computable keys are re-derived
 * here, official marking, server-side timing (whole paper and sectional), ownership, topic
 * performance, prerequisite-aware recommendations, and study plans that keep completed work.
 */

/** The key of a question as a comparable value: the option text, or the numeric value. */
const keyOf = (q: PracticeQuestion): string | number => {
  const a = q.answer;
  if ('index' in a) return q.options![a.index];
  if ('indices' in a) return a.indices.join(',');
  return a.value;
};

function kruskal(nodes: string[], edges: Array<[string, string, number]>) {
  const parent = new Map(nodes.map(n => [n, n]));
  const find = (x: string): string => (parent.get(x) === x ? x : find(parent.get(x)!));
  let total = 0;
  for (const [a, b, w] of [...edges].sort((x, y) => x[2] - y[2])) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      parent.set(ra, rb);
      total += w;
    }
  }
  return total;
}

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

export async function runExamPrepTests() {
  console.log('🧪 Running Exam Pilot (E2, E3, E4) Tests...');

  // === Definitions =================================================================================
  for (const exam of EXAMS) {
    assert.ok(exam.sources.length > 0 && exam.sources.every(s => /^https:\/\/(gate2026\.iitg\.ac\.in|ssc\.gov\.in)\//.test(s.url) && s.accessedOn === '2026-10-12'), `${exam.id}: official sources with access dates`);
    assert.match(exam.disclaimer, /not affiliated/);
    const topics = topicsOf(exam);
    const ids = new Set(topics.map(t => t.id));
    assert.equal(ids.size, topics.length, `${exam.id}: unique topic ids`);
    for (const t of topics) for (const p of t.prerequisites) assert.ok(ids.has(p), `${exam.id}: ${t.id} prerequisite ${p} exists`);
    // No prerequisite cycles: every topic can be placed
    const plan = buildPlan(topics.map(t => ({ topicId: t.id, sectionId: t.sectionId, estimatedHours: t.estimatedHours, prerequisites: t.prerequisites, status: 'not_practised' })), 1000);
    assert.equal(new Set(plan.map(i => i.topicId)).size, topics.length);
  }
  assert.equal(GATE_CS_2026.sections.length, 11, 'GA plus the ten sections of the official CS syllabus');
  assert.deepEqual(SSC_CGL_2026_TIER1.sections.map(s => s.name), ['General Intelligence and Reasoning', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension'], 'the four Tier-I subjects of paragraph 13.8');
  console.log('  ✓ Definitions: official sources with dates, disclaimers, valid acyclic prerequisites, official sections');

  // === Bank ======================================================================================
  assert.equal(new Set(QUESTIONS.map(q => q.id)).size, QUESTIONS.length, 'question ids are unique');
  for (const q of QUESTIONS) {
    const exam = EXAMS.find(e => e.id === q.examId)!;
    assert.ok(topicsOf(exam).some(t => t.id === q.topicId && t.sectionId === q.sectionId), `${q.id}: topic in its section`);
    assert.ok(q.explanation.length > 15, `${q.id}: explained`);
    if (q.type !== 'nat') assert.ok(q.options && q.options.length >= 2, `${q.id}: options`);
    const a = q.answer;
    if ('index' in a) assert.ok(a.index >= 0 && a.index < q.options!.length, `${q.id}: key in range`);
    if ('indices' in a) assert.ok(a.indices.every(i => i >= 0 && i < q.options!.length), `${q.id}: keys in range`);
    if (exam.id === 'ssc-cgl-2026-tier1') assert.ok(q.marks === 2 && q.type === 'mcq', `${q.id}: SSC items are 2-mark MCQs`);
    else assert.ok(q.marks === 1 || q.marks === 2, `${q.id}: GATE items carry 1 or 2 marks`);
    assert.ok(!/previous year|official question|actual GATE question/i.test(q.stem));
  }
  for (const exam of EXAMS) for (const s of exam.sections) assert.ok(questionsFor(exam.id).some(q => q.sectionId === s.id), `${exam.id}/${s.id}: has questions`);

  // Computable keys, re-derived independently
  const derived: Record<string, string | number> = {
    'g-ga-q1': Math.round(1.2 * 0.8 * 100),
    'g-ga-q2': factorial(5) / (factorial(2) * factorial(2)),
    'g-ga-q3': String(Math.log2(8) + Math.log10(1000)),
    'g-ga-a2': 6 * 7,
    'g-em-d1': 2 ** 5,
    'g-em-d3': (6 * 5) / 2,
    'g-em-d4': 1 + 2 * 9,
    'g-em-l1': 2 * 4 - 1 * 3,
    'g-em-p1': 1 - 0.25,
    'g-em-p2': (0.5 * 0.8) / (0.5 * 0.8 + 0.5 * 0.2),
    'g-dl-1': parseInt('1011', 2),
    'g-dl-3': parseInt('11111110', 2) - 256,
    'g-coa-1': 5 + 99,
    'g-coa-2': 0.9 * 10 + 0.1 * 100,
    'g-pds-1': 2 ** 4 - 1,
    'g-pds-3': 5 * 3 * 1,
    'g-algo-2': Math.floor(Math.log2(1023)) + 1,
    'g-algo-3': kruskal(['A', 'B', 'C', 'D'], [['A', 'B', 1], ['B', 'C', 2], ['C', 'D', 3], ['A', 'D', 4], ['A', 'C', 5]]),
    'g-os-1': Math.round(((0 + 5 + 8) / 3) * 100) / 100,
    'g-os-3': 2 ** 32 / 2 ** 12,
    'g-db-2': 3 * 4,
    'g-cn-1': 2 ** 6 - 2,
    's-gir-2': String(4 ** 3),
    's-gir-4': String(47 * 2 + 1),
    's-gir-5': String.fromCharCode(64 + 15),
    's-gir-6': 'DOG'.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 1)).join(''),
    's-gir-7': 'DESK'.split('').map(c => c.charCodeAt(0) - 64).join('-'),
    's-qa-1': String(0.15 * 240),
    's-qa-2': `₹${((5000 * 8 * 3) / 100).toLocaleString('en-IN')}`,
    's-qa-3': `${((500 - 400) / 400) * 100}%`,
    's-qa-4': String((10 * 15) / (10 + 15)),
    's-qa-5': String((72 * 5) / 18),
    's-qa-6': String((3 + 2) ** 2 - (3 - 2) ** 2),
    's-qa-7': `${0.5 * 10 * 6} cm²`,
    's-qa-8': `${3 ** 3} cm³`,
  };
  for (const [id, value] of Object.entries(derived)) {
    const q = QUESTIONS_BY_ID.get(id)!;
    const key = keyOf(q);
    if (typeof key === 'number') assert.ok(Math.abs(key - Number(value)) < 1e-6, `${id}: key ${key}, derived ${value}`);
    else assert.equal(key, String(value), `${id}: key "${key}", derived "${value}"`);
  }
  console.log(`  ✓ Bank: ${QUESTIONS.length} original questions, every section covered, ${Object.keys(derived).length} keys re-derived`);

  // === Marking ===================================================================================
  const g1 = QUESTIONS_BY_ID.get('g-ga-v1')!; // 1-mark MCQ
  const g2 = QUESTIONS_BY_ID.get('g-ga-q3')!; // 2-mark MCQ
  const nat = QUESTIONS_BY_ID.get('g-os-1')!; // 2-mark NAT, tolerance 0.01
  const msq = QUESTIONS_BY_ID.get('g-os-4')!; // 2-mark MSQ
  const ssc = QUESTIONS_BY_ID.get('s-qa-1')!;
  assert.deepEqual(markQuestion(GATE_CS_2026, g1, 1), { outcome: 'correct', marks: 1 });
  assert.ok(Math.abs(markQuestion(GATE_CS_2026, g1, 0).marks + 1 / 3) < 1e-9, '1-mark MCQ: −1/3');
  assert.ok(Math.abs(markQuestion(GATE_CS_2026, g2, 0).marks + 2 / 3) < 1e-9, '2-mark MCQ: −2/3');
  assert.deepEqual(markQuestion(GATE_CS_2026, nat, 4.0), { outcome: 'wrong', marks: -0 }, 'NAT: no negative marking');
  assert.equal(markQuestion(GATE_CS_2026, nat, 4.34).outcome, 'correct', 'NAT within tolerance');
  assert.deepEqual(markQuestion(GATE_CS_2026, msq, [0, 1]), { outcome: 'wrong', marks: -0 }, 'MSQ: no partial marks, no negative');
  assert.equal(markQuestion(GATE_CS_2026, msq, [2, 0, 1]).outcome, 'correct', 'MSQ order does not matter');
  assert.deepEqual(markQuestion(SSC_CGL_2026_TIER1, ssc, 1), { outcome: 'correct', marks: 2 });
  assert.deepEqual(markQuestion(SSC_CGL_2026_TIER1, ssc, 0), { outcome: 'wrong', marks: -0.5 });
  assert.deepEqual(markQuestion(SSC_CGL_2026_TIER1, ssc, null), { outcome: 'unanswered', marks: 0 });
  assert.equal(isCorrect(g1, '1' as never), false, 'a choice must be the index, not text');
  for (const [q, r] of [[g1, 4], [g1, 1.5], [msq, []], [msq, [0, 0]], [msq, 1], [nat, 'four'], [nat, Infinity]] as const) {
    assert.ok(responseProblem(q, r), `${q.id} rejects ${JSON.stringify(r)}`);
  }
  assert.equal(responseProblem(nat, null), null, 'null clears an answer');
  console.log('  ✓ Marking: GATE −1/3 and −2/3 for MCQs only, NAT tolerance, MSQ exact; SSC +2/−0.5; response shapes validated');

  // === Performance, recommendations, plans (pure) =================================================
  assert.deepEqual([topicStatus(0, null), topicStatus(2, 1), topicStatus(4, 0.75), topicStatus(4, 0.5), topicStatus(4, 0.25)], ['not_practised', 'insufficient', 'strength', 'developing', 'weakness']);
  const at = new Date('2026-10-01T00:00:00Z');
  const items = [
    ...Array.from({ length: 4 }, () => ({ topicId: 'algo-core', outcome: 'wrong' as const, marksAwarded: -0.33, completedAt: at })),
    ...Array.from({ length: 4 }, () => ({ topicId: 'db-core', outcome: 'correct' as const, marksAwarded: 1, completedAt: at })),
  ];
  const perf = aggregateTopics(GATE_CS_2026, items);
  const recs = recommend(GATE_CS_2026, perf);
  assert.deepEqual(recs.slice(0, 3).map(r => [r.topicId, r.action]), [['pds-core', 'study_prerequisite'], ['em-discrete', 'study_prerequisite'], ['algo-core', 'practise_weak_topic']], 'untried prerequisites come before the weak topic');
  const planItems = buildPlan(
    topicsOf(GATE_CS_2026).map(t => ({ topicId: t.id, sectionId: t.sectionId, estimatedHours: t.estimatedHours, prerequisites: t.prerequisites, status: perf.find(p => p.topicId === t.id)!.status })),
    10
  );
  const firstWeekOf = (id: string) => Math.min(...planItems.filter(i => i.topicId === id).map(i => i.week));
  const lastWeekOf = (id: string) => Math.max(...planItems.filter(i => i.topicId === id).map(i => i.week));
  assert.ok(lastWeekOf('pds-core') <= firstWeekOf('algo-core') && lastWeekOf('em-discrete') <= firstWeekOf('algo-core'), 'prerequisites are planned first');
  const perWeek = new Map<number, number>();
  planItems.forEach(i => perWeek.set(i.week, (perWeek.get(i.week) ?? 0) + i.hours));
  assert.ok([...perWeek.values()].every(h => h <= 10), 'no week exceeds the available hours');
  assert.equal(planItems.find(i => i.topicId === 'db-core')!.kind, 'revise', 'a strength gets light revision only');
  assert.equal(planItems.filter(i => i.topicId === 'db-core').reduce((s, i) => s + i.hours, 0), 5, 'revision is a quarter of the 20-hour estimate');
  console.log('  ✓ Topic status thresholds, prerequisite-first recommendations, plans within weekly hours');

  // === HTTP ======================================================================================
  await ExamAttempt.deleteMany({});
  const h = await startHttpHarness();
  try {
    assert.equal((await h.api('GET', '/exams')).status, 401);
    const alice = await h.registerUser('exam-alice');
    const bob = await h.registerUser('exam-bob');
    const A = (method: string, path: string, json?: unknown) => h.api(method, path, { token: alice.token, json });
    const B = (method: string, path: string, json?: unknown) => h.api(method, path, { token: bob.token, json });

    const catalog = (await A('GET', '/exams')).body.data.exams;
    assert.deepEqual(catalog.map((e: { id: string }) => e.id), ['gate-cs-2026', 'ssc-cgl-2026-tier1']);
    assert.ok(catalog[0].sections.some((s: { topics: Array<{ limitedContent: boolean }> }) => s.topics.some(t => t.limitedContent)), 'topics with few questions are flagged');
    assert.equal((await A('GET', '/exams/neet-2026')).status, 404);

    // Untimed GATE practice
    let r = await A('POST', '/exams/gate-cs-2026/attempts', { count: 6, mode: 'practice' });
    assert.equal(r.status, 201);
    const a1 = r.body.data;
    assert.equal(a1.questions.length, 6);
    assert.ok(!/"correctAnswer"|"explanation"|"answer"|"outcome"/.test(JSON.stringify(a1.questions)), 'no answers before submission');
    let expectedMarks = 0;
    for (const [i, view] of a1.questions.entries()) {
      const q = QUESTIONS_BY_ID.get(view.questionId)!;
      const a = q.answer;
      // Answer half right, half wrong
      const right = 'index' in a ? a.index : 'indices' in a ? a.indices : a.value;
      const wrong = 'index' in a ? (a.index + 1) % q.options!.length : 'indices' in a ? [((a.indices[0] ?? 0) + 1) % q.options!.length] : a.value + 1000;
      const response = i % 2 === 0 ? right : wrong;
      r = await A('PUT', `/exams/attempts/${a1.id}/answers`, { questionId: q.id, response });
      assert.equal(r.status, 200, `answer ${q.id}`);
      expectedMarks += markQuestion(GATE_CS_2026, q, response as never).marks;
    }
    const firstQ = QUESTIONS_BY_ID.get(a1.questions[0].questionId)!;
    for (const bad of [{ questionId: firstQ.id, response: 'A' }, { questionId: firstQ.id, response: { pick: 1 } }, { questionId: 'g-not-here', response: 0, extra: 1 }]) {
      assert.equal((await A('PUT', `/exams/attempts/${a1.id}/answers`, bad)).status, 400);
    }
    assert.equal((await A('PUT', `/exams/attempts/${a1.id}/answers`, { questionId: 's-qa-1', response: 1 })).status, 404, 'a question outside the attempt');
    for (const [label, call] of [
      ['read', () => B('GET', `/exams/attempts/${a1.id}`)],
      ['answer', () => B('PUT', `/exams/attempts/${a1.id}/answers`, { questionId: firstQ.id, response: null })],
      ['submit', () => B('POST', `/exams/attempts/${a1.id}/submit`)],
      ['malformed', () => B('GET', '/exams/attempts/xyz')],
    ] as const) {
      assert.equal((await call()).status, 404, `bob: ${label}`);
    }
    r = await A('POST', `/exams/attempts/${a1.id}/submit`);
    assert.equal(r.body.data.status, 'completed');
    assert.equal(r.body.data.score.marks, Math.round(expectedMarks * 100) / 100, 'server marks equal the official scheme applied independently');
    assert.ok(r.body.data.questions.every((q: { explanation?: string; correctAnswer?: string }) => q.explanation && q.correctAnswer), 'answers revealed after submission');
    assert.equal((await A('PUT', `/exams/attempts/${a1.id}/answers`, { questionId: firstQ.id, response: null })).status, 409);
    console.log('  ✓ HTTP practice: hidden answers until submit, independent marks match, 3 invalid answers 400, 4 isolation probes 404');

    // Timed GATE: one deadline
    r = await A('POST', '/exams/gate-cs-2026/attempts', { count: 3, mode: 'timed' });
    const t1 = r.body.data;
    assert.equal(t1.timeLimitSec, 3 * GATE_CS_2026.secondsPerQuestion);
    await ExamAttempt.updateOne({ _id: t1.id }, { deadline: new Date(Date.now() - 60_000) });
    r = await A('PUT', `/exams/attempts/${t1.id}/answers`, { questionId: t1.questions[0].questionId, response: 0 });
    assert.deepEqual([r.status, r.body.error?.code], [409, 'TIME_UP']);
    r = await A('GET', `/exams/attempts/${t1.id}`);
    assert.deepEqual([r.body.data.status, r.body.data.timedOut], ['completed', true], 'an expired attempt is completed with what was answered in time');

    // Timed SSC: sectional timers
    r = await A('POST', '/exams/ssc-cgl-2026-tier1/attempts', { count: 12, mode: 'timed', sectionIds: ['reasoning', 'quant'] });
    const s1 = r.body.data;
    assert.deepEqual(s1.sections.map((s: { sectionId: string }) => s.sectionId), ['reasoning', 'quant'], 'official section order');
    assert.ok(s1.sections[0].deadline && !s1.sections[1].startedAt, 'only the first section is running');
    assert.equal(s1.sections[0].timeLimitSec, s1.questions.filter((q: { sectionId: string }) => q.sectionId === 'reasoning').length * 36);
    const quantQ = s1.questions.find((q: { sectionId: string }) => q.sectionId === 'quant').questionId;
    const reasonQ = s1.questions.find((q: { sectionId: string }) => q.sectionId === 'reasoning').questionId;
    assert.equal((await A('PUT', `/exams/attempts/${s1.id}/answers`, { questionId: quantQ, response: 0 })).body.error.code, 'SECTION_NOT_STARTED');
    assert.equal((await A('PUT', `/exams/attempts/${s1.id}/answers`, { questionId: reasonQ, response: 0 })).status, 200);
    r = await A('POST', `/exams/attempts/${s1.id}/sections/quant/start`);
    assert.ok(r.body.data.sections[0].closedAt && r.body.data.sections[1].deadline, 'starting the next section closes the previous one');
    assert.equal((await A('PUT', `/exams/attempts/${s1.id}/answers`, { questionId: reasonQ, response: 1 })).body.error.code, 'SECTION_CLOSED', 'a closed section cannot be changed');
    assert.equal((await A('POST', `/exams/attempts/${s1.id}/sections/quant/start`)).status, 409, 'a section starts once');
    assert.equal((await A('POST', `/exams/attempts/${a1.id}/sections/quant/start`)).status, 409, 'not on a submitted attempt');
    await ExamAttempt.updateOne({ _id: s1.id }, { 'sections.1.deadline': new Date(Date.now() - 60_000) });
    assert.equal((await A('GET', `/exams/attempts/${s1.id}`)).body.data.timedOut, true, 'the last section ending ends the attempt');
    console.log('  ✓ Timing: whole-paper deadline (GATE) and in-order sectional timers (SSC) enforced on the server');

    // === Race: an answer whose read is slow must not land after the submission scored the attempt ===
    // Delays the answer's read of the attempt so the submission runs in between, as it could on a
    // loaded server. Without the per-attempt lock the answer would be written after scoring.
    const dave = await h.registerUser('exam-race');
    const racedAttempt = (await h.api('POST', '/exams/gate-cs-2026/attempts', { token: dave.token, json: { count: 2, mode: 'practice' } })).body.data;
    const slowQuestion = racedAttempt.questions[0].questionId;
    const originalFindOne = ExamAttempt.findOne.bind(ExamAttempt);
    let delayNext = true;
    (ExamAttempt as unknown as { findOne: typeof ExamAttempt.findOne }).findOne = ((...args: Parameters<typeof ExamAttempt.findOne>) => {
      const query = originalFindOne(...args);
      if (!delayNext) return query;
      delayNext = false;
      return query.then(doc => new Promise(resolve => setTimeout(() => resolve(doc), 150))) as unknown as ReturnType<typeof ExamAttempt.findOne>;
    }) as typeof ExamAttempt.findOne;
    try {
      const slowAnswer = ExamPracticeService.answer(dave.userId, racedAttempt.id, slowQuestion, 0).then(() => 'stored', (e: { code?: string }) => e.code);
      await new Promise(r => setTimeout(r, 20));
      await ExamPracticeService.submit(dave.userId, racedAttempt.id);
      const outcomeOfAnswer = await slowAnswer;
      const stored = await ExamAttempt.findById(racedAttempt.id).lean();
      const item = stored!.items.find(i => i.questionId === slowQuestion)!;
      // Either the answer was stored before scoring (and scored), or it was refused: never stored unscored
      assert.ok(
        (outcomeOfAnswer === 'stored' && item.response !== null && item.outcome !== 'unanswered') ||
          (outcomeOfAnswer === 'ATTEMPT_COMPLETED' && item.response === null && item.outcome === 'unanswered'),
        `answer ${outcomeOfAnswer}; stored response ${JSON.stringify(item.response)} with outcome ${item.outcome}`
      );
    } finally {
      (ExamAttempt as unknown as { findOne: typeof ExamAttempt.findOne }).findOne = originalFindOne as typeof ExamAttempt.findOne;
    }
    console.log('  ✓ Race: an answer delayed past a submission is either scored or refused, never stored unscored');

    for (const [label, body] of [
      ['too many', { count: 41, mode: 'practice' }],
      ['bad mode', { count: 5, mode: 'exam-day' }],
      ['unknown topic', { count: 5, mode: 'practice', topicIds: ['quantum-computing'] }],
      ['extra field', { count: 5, mode: 'practice', marks: 100 }],
    ] as const) {
      assert.equal((await A('POST', '/exams/gate-cs-2026/attempts', body)).status, 400, label);
    }
    const history = (await A('GET', '/exams/gate-cs-2026/attempts')).body.data.attempts;
    assert.equal(history.length, 2);
    assert.equal((await B('GET', '/exams/gate-cs-2026/attempts')).body.data.attempts.length, 0, "bob sees none of alice's attempts");

    // Performance and plan
    const perfRes = (await A('GET', '/exams/gate-cs-2026/performance')).body.data;
    assert.equal(perfRes.completedAttempts, 2);
    assert.ok(perfRes.topics.some((t: { status: string }) => t.status === 'insufficient'), 'few answers: no strength or weakness label');
    assert.ok(perfRes.recommendations.length > 0);
    assert.equal((await A('GET', '/exams/gate-cs-2026/plan')).body.data.plan, null, 'no plan until requested');
    for (const bad of [{ hoursPerWeek: 0 }, { hoursPerWeek: 61 }, { hoursPerWeek: 8, startDate: '12/10/2026' }, { hoursPerWeek: 8, promise: 'rank 1' }]) {
      assert.equal((await A('PUT', '/exams/gate-cs-2026/plan', bad)).status, 400);
    }
    let plan = (await A('PUT', '/exams/gate-cs-2026/plan', { hoursPerWeek: 8, startDate: '2026-10-19' })).body.data.plan;
    assert.equal(plan.startDate, '2026-10-19');
    assert.equal(plan.items[0].weekStarts, '2026-10-19');
    const doneItem = plan.items[0];
    const weeksAt8 = plan.totals.weeks;
    assert.ok(plan.items.every((i: { hours: number; week: number }) => i.hours <= 8), 'no week holds more than the chosen hours');
    plan = (await A('PATCH', `/exams/gate-cs-2026/plan/items/${doneItem.id}`, { status: 'done' })).body.data.plan;
    plan = (await A('PUT', '/exams/gate-cs-2026/plan', { hoursPerWeek: 4 })).body.data.plan;
    const kept = plan.items.find((i: { id: string }) => i.id === doneItem.id);
    const perWeek = new Map<number, number>();
    for (const i of plan.items.filter((x: { status: string }) => x.status === 'pending')) perWeek.set(i.week, (perWeek.get(i.week) ?? 0) + i.hours);
    assert.ok([...perWeek.values()].every(h => h <= 4), 'halving the hours keeps every week within 4 hours');
    assert.ok(plan.totals.weeks > weeksAt8 * 1.7, `halving the hours roughly doubles the plan: ${weeksAt8} weeks at 8 h, ${plan.totals.weeks} at 4 h`);
    assert.deepEqual([kept.status, kept.week, kept.hours], ['done', doneItem.week, doneItem.hours], 'completed work is preserved on regeneration');
    assert.ok(plan.items.filter((i: { status: string }) => i.status === 'pending').every((i: { week: number }) => i.week > doneItem.week), 'new work is planned after it');
    assert.equal(plan.regenerations, 1);
    assert.equal((await A('PATCH', `/exams/gate-cs-2026/plan/items/${new mongoose.Types.ObjectId()}`, { status: 'done' })).status, 404);
    assert.equal((await B('GET', '/exams/gate-cs-2026/plan')).body.data.plan, null, "bob has no access to alice's plan");
    assert.equal((await B('PATCH', `/exams/gate-cs-2026/plan/items/${doneItem.id}`, { status: 'pending' })).status, 404);
    console.log('  ✓ HTTP: 4 invalid starts, per-user history, performance, plan validation, completed items kept, other users 404');

    assert.equal(await UserSkill.countDocuments({ userId: alice.userId }), 0, 'exam practice adds no career skill evidence');
  } finally {
    await h.close();
  }
  console.log('✅ Exam Pilot (E2, E3, E4) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runExamPrepTests();
    } catch (err) {
      console.error('❌ Exam Pilot Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
