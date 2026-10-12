import './setupEnv.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ASSESSMENT_BANK, SQL_TABLES, TASKS_BY_ID } from '../seed/technicalAssessmentBank.js';
import { isCorrect, TASK_KINDS } from '../services/interview/TechnicalAssessmentService.js';
import TechnicalAssessment from '../models/TechnicalAssessment.js';
import { lookupSkill } from '../utils/skillLexicon.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * D4 technical assessments: a valid curated bank whose keys are re-derived here, answer matching,
 * keys withheld until a task is answered, server-side scoring, strict validation, isolation, and
 * an audit that the runtime modules cannot execute code.
 */

const here = path.dirname(fileURLToPath(import.meta.url));

/** Parses the markdown tables shown with the SQL tasks. */
function tables() {
  const out: Record<string, Array<Record<string, string>>> = {};
  for (const block of SQL_TABLES.split(/\n\s*\n/)) {
    const [name, header, , ...rows] = block.trim().split('\n');
    const cols = header.split('|').map(s => s.trim()).filter(Boolean);
    out[name.trim()] = rows.map(r => {
      const cells = r.split('|').map(s => s.trim()).filter(Boolean);
      return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
    });
  }
  return out;
}

/** Runs one of the bank's own JavaScript snippets in a sandbox, in this test only, to check its key. */
async function runCuratedSnippet(code: string): Promise<string[]> {
  const output: string[] = [];
  vm.runInNewContext(code, { console: { log: (...a: unknown[]) => output.push(a.map(String).join(' ')) }, setTimeout, Promise }, { timeout: 500 });
  await new Promise(r => setTimeout(r, 30));
  return output;
}

export async function runTechnicalAssessmentTests() {
  console.log('🧪 Running Technical Assessment (D4) Tests...');

  // === Bank integrity ===========================================================================
  assert.equal(new Set(ASSESSMENT_BANK.map(t => t.id)).size, ASSESSMENT_BANK.length, 'task ids are unique');
  for (const t of ASSESSMENT_BANK) {
    assert.equal(lookupSkill(t.skill)?.name, t.skill, `${t.id}: skill is a canonical lexicon name`);
    assert.ok(t.explanation.length > 20, `${t.id}: has an explanation`);
    if (t.answer.type === 'choice') assert.ok(t.answer.correct >= 0 && t.answer.correct < t.answer.options.length, `${t.id}: key within options`);
    if (t.answer.type === 'line') assert.ok(t.answer.correct >= 1 && t.answer.correct <= t.code.split('\n').length, `${t.id}: key within lines`);
    if (t.answer.type === 'text') assert.ok(t.answer.accepted.length > 0);
  }
  assert.deepEqual([...new Set(ASSESSMENT_BANK.map(t => t.kind))].sort(), [...TASK_KINDS].sort(), 'every kind is represented');

  // SQL keys re-derived from the stated tables
  const { employees, orders } = tables();
  const sal = (e: Record<string, string>) => Number(e.salary);
  const expectedSql: Record<string, string> = {
    'sql-group-count': String(new Set(employees.filter(e => sal(e) > 55).map(e => e.dept)).size),
    'sql-offset': [...employees].sort((a, b) => sal(b) - sal(a))[1].name,
    'sql-avg': String(employees.filter(e => e.dept === 'Sales').reduce((s, e) => s + sal(e), 0) / employees.filter(e => e.dept === 'Sales').length),
    'sql-left-join-zero': String(employees.filter(e => !orders.some(o => o.employee_id === e.id)).length),
    'sql-count-distinct': String(new Set(employees.map(e => e.dept)).size),
  };
  for (const [id, value] of Object.entries(expectedSql)) {
    const task = TASKS_BY_ID.get(id)!;
    assert.ok(isCorrect(task.answer, value), `${id}: key matches the tables (${value})`);
  }

  // JavaScript keys checked by running the bank's own snippets in a sandbox (test only)
  let jsChecked = 0;
  for (const t of ASSESSMENT_BANK.filter(t => t.kind === 'trace' && t.language === 'javascript')) {
    const out = await runCuratedSnippet(t.code);
    if (t.answer.type === 'text') assert.ok(isCorrect(t.answer, out.join(' ')), `${t.id}: printed ${out.join(' ')}`);
    else if (t.answer.type === 'choice') assert.equal(t.answer.options[t.answer.correct], out.join(' '), `${t.id}: printed ${out.join(' ')}`);
    jsChecked += 1;
  }
  console.log(`  ✓ Bank: ${ASSESSMENT_BANK.length} tasks, ${TASK_KINDS.length} kinds; ${Object.keys(expectedSql).length} SQL and ${jsChecked} JavaScript keys re-derived`);

  // === Matching ==================================================================================
  const text = (accepted: string[]) => ({ type: 'text' as const, accepted });
  assert.ok(isCorrect(text(['Dina']), '  DINA '));
  assert.ok(isCorrect(text(['object']), '"object"'));
  assert.ok(isCorrect(text(['70']), '70.0'));
  assert.ok(!isCorrect(text(['70']), '7'));
  assert.ok(!isCorrect(text(['3']), '3 rows and more'));
  assert.ok(isCorrect({ type: 'choice', options: ['a', 'b'], correct: 1 }, 1));
  assert.ok(!isCorrect({ type: 'choice', options: ['a', 'b'], correct: 1 }, '1' as never), 'a choice must be the index, not text');
  console.log('  ✓ Matching ignores case, quotes and spacing, compares numbers numerically, and nothing looser');

  // === No code execution ==========================================================================
  const runtime = ['../services/interview/TechnicalAssessmentService.ts', '../controllers/TechnicalAssessmentController.ts', '../seed/technicalAssessmentBank.ts', '../models/TechnicalAssessment.ts'];
  const forbidden = /\beval\s*\(|new\s+Function\s*\(|from\s+['"](node:)?vm['"]|require\(\s*['"](node:)?vm['"]|child_process|execSync|spawn\s*\(|runInNewContext|runInThisContext/;
  for (const file of runtime) {
    const source = fs.readFileSync(path.resolve(here, file), 'utf8');
    assert.ok(!forbidden.test(source), `${file} contains a code-execution primitive`);
  }
  console.log(`  ✓ Audit: ${runtime.length} runtime modules contain no eval, Function, vm or process-spawning calls`);

  // === HTTP ======================================================================================
  await TechnicalAssessment.deleteMany({});
  const h = await startHttpHarness();
  try {
    assert.equal((await h.api('GET', '/interviews/assessments/catalog')).status, 401);
    const alice = await h.registerUser('assess-alice');
    const bob = await h.registerUser('assess-bob');
    const A = (method: string, p: string, json?: unknown) => h.api(method, p, { token: alice.token, json });

    const catalog = (await A('GET', '/interviews/assessments/catalog')).body.data;
    assert.equal(catalog.total, ASSESSMENT_BANK.length);
    assert.equal(catalog.skills.SQL, 5);

    const started = await A('POST', '/interviews/assessments', { skills: ['SQL'], count: 3 });
    assert.equal(started.status, 201);
    const a1 = started.body.data;
    assert.equal(a1.tasks.length, 3);
    assert.ok(a1.tasks.every((t: { skill: string; tables?: string }) => t.skill === 'SQL' && t.tables?.includes('employees')));
    const raw = JSON.stringify(started.body.data.tasks);
    assert.ok(!/"explanation"|"correctAnswer"|"accepted"|"correct":/.test(raw), 'no answer key is sent before a task is answered');

    // Answer the first correctly, the second wrongly, with code as a "value"
    const first = TASKS_BY_ID.get(a1.tasks[0].taskId)!;
    const right = first.answer.type === 'text' ? first.answer.accepted[0] : 0;
    let r = await A('POST', `/interviews/assessments/${a1.id}/answers`, { taskId: first.id, response: right });
    assert.equal(r.status, 200);
    const firstView = r.body.data.tasks.find((t: { taskId: string }) => t.taskId === first.id);
    assert.deepEqual([firstView.correct, typeof firstView.explanation, typeof firstView.correctAnswer], [true, 'string', 'string']);
    assert.ok(!r.body.data.tasks.filter((t: { answered: boolean }) => !t.answered).some((t: { explanation?: string }) => t.explanation), 'unanswered tasks stay without keys');

    const second = a1.tasks[1].taskId;
    r = await A('POST', `/interviews/assessments/${a1.id}/answers`, { taskId: second, response: "require('child_process').execSync('whoami')" });
    assert.equal(r.status, 200, 'code typed as an answer is stored as text, never run');
    assert.equal(r.body.data.tasks.find((t: { taskId: string }) => t.taskId === second).correct, false);

    assert.equal((await A('POST', `/interviews/assessments/${a1.id}/answers`, { taskId: second, response: '2' })).status, 409, 'an answer cannot be changed');
    assert.equal((await A('POST', `/interviews/assessments/${a1.id}/answers`, { taskId: 'review-js-assignment', response: 2 })).status, 404, 'a task outside the attempt');
    assert.equal((await A('POST', `/interviews/assessments/${a1.id}/answers`, { taskId: a1.tasks[2].taskId, response: 'x'.repeat(201) })).status, 400);

    // Isolation
    for (const [label, call] of [
      ['read', () => h.api('GET', `/interviews/assessments/${a1.id}`, { token: bob.token })],
      ['answer', () => h.api('POST', `/interviews/assessments/${a1.id}/answers`, { token: bob.token, json: { taskId: a1.tasks[2].taskId, response: '1' } })],
      ['finish', () => h.api('POST', `/interviews/assessments/${a1.id}/finish`, { token: bob.token })],
      ['malformed id', () => h.api('GET', '/interviews/assessments/nope', { token: bob.token })],
    ] as const) {
      assert.equal((await call()).status, 404, `bob: ${label}`);
    }
    assert.equal((await h.api('GET', '/interviews/assessments', { token: bob.token })).body.data.assessments.length, 0);

    // Finishing counts the unanswered task as incorrect
    r = await A('POST', `/interviews/assessments/${a1.id}/finish`);
    assert.deepEqual(r.body.data.score, { answered: 2, correct: 1, total: 3, percent: 33 });
    assert.equal(r.body.data.status, 'completed');
    assert.equal((await A('POST', `/interviews/assessments/${a1.id}/answers`, { taskId: a1.tasks[2].taskId, response: '1' })).status, 409, 'no answers after finishing');
    console.log('  ✓ HTTP: keys withheld until answered, code-as-answer stored as text, one answer per task, finish scores, 4 isolation probes 404');

    // Line and choice answers, and auto-completion
    const review = await A('POST', '/interviews/assessments', { kinds: ['review'], count: 5 });
    const reviewTasks = review.body.data.tasks as Array<{ taskId: string; answerType: string; lineCount?: number; options?: string[] }>;
    const lineTask = reviewTasks.find(t => t.answerType === 'line');
    assert.ok(lineTask && lineTask.lineCount === 6);
    assert.equal((await A('POST', `/interviews/assessments/${review.body.data.id}/answers`, { taskId: lineTask!.taskId, response: 7 })).status, 400, 'line out of range');
    assert.equal((await A('POST', `/interviews/assessments/${review.body.data.id}/answers`, { taskId: lineTask!.taskId, response: 'two' })).status, 400, 'line must be a number');
    let last;
    for (const t of reviewTasks) {
      const key = TASKS_BY_ID.get(t.taskId)!.answer;
      last = await A('POST', `/interviews/assessments/${review.body.data.id}/answers`, { taskId: t.taskId, response: key.type === 'text' ? key.accepted[0] : key.correct });
    }
    assert.deepEqual([last!.body.data.status, last!.body.data.score.percent], ['completed', 100], 'answering every task completes the attempt');
    assert.ok(last!.body.data.bySkill.length >= 1);

    // A new attempt prefers tasks not seen in the last two
    const again = await A('POST', '/interviews/assessments', { skills: ['SQL'], count: 2 });
    const unseen = ['sql-group-count', 'sql-offset', 'sql-avg', 'sql-left-join-zero', 'sql-count-distinct'].filter(id => !a1.tasks.some((t: { taskId: string }) => t.taskId === id));
    assert.deepEqual(again.body.data.tasks.map((t: { taskId: string }) => t.taskId).sort(), unseen.sort());

    for (const [label, body] of [
      ['unknown skill', { skills: ['Cobol'] }],
      ['unknown kind', { kinds: ['execute'] }],
      ['too many', { count: 11 }],
      ['code field', { code: 'print(1)' }],
    ] as const) {
      assert.equal((await A('POST', '/interviews/assessments', body)).status, 400, label);
    }
    console.log('  ✓ Line/choice validation, auto-completion at 100%, unseen tasks preferred, 4 invalid starts rejected');
  } finally {
    await h.close();
  }
  console.log('✅ Technical Assessment (D4) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runTechnicalAssessmentTests();
    } catch (err) {
      console.error('❌ Technical Assessment Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
