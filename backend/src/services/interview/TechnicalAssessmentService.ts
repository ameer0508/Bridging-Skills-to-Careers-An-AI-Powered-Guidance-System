import crypto from 'crypto';
import mongoose from 'mongoose';
import TechnicalAssessment, { ITechnicalAssessment } from '../../models/TechnicalAssessment.js';
import { ASSESSMENT_BANK, AssessmentTask, AnswerKey, SQL_TABLES, TaskKind, TASKS_BY_ID } from '../../seed/technicalAssessmentBank.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Technical assessments without code execution (D4).
 *
 * The candidate reads code and answers: an option, a line number or a short value. Answers are
 * compared with the curated keys. No code from the bank or from a user is run, evaluated or sent
 * anywhere; the module imports nothing that could execute it (asserted in tests). Answer keys and
 * explanations are only returned for tasks already answered.
 */

export const TASK_KINDS: TaskKind[] = ['trace', 'review', 'complexity', 'sql'];
export const MIN_TASKS = 1;
export const MAX_TASKS = 10;
export const MAX_TEXT_ANSWER = 200;

export interface TaskView {
  taskId: string;
  kind: TaskKind;
  skill: string;
  language: AssessmentTask['language'];
  difficulty: AssessmentTask['difficulty'];
  prompt: string;
  code: string;
  /** For SQL tasks: the tables the query reads. */
  tables?: string;
  answerType: AnswerKey['type'];
  options?: string[];
  /** For 'line' answers: how many lines the code has. */
  lineCount?: number;
  answered: boolean;
  response?: string | number;
  correct?: boolean;
  /** Only after answering. */
  correctAnswer?: string;
  explanation?: string;
}

export interface AssessmentView {
  id: string;
  status: 'active' | 'completed';
  filters: { skills: string[]; kinds: string[] };
  tasks: TaskView[];
  progress: { answered: number; total: number };
  score: { answered: number; correct: number; total: number; percent: number } | null;
  bySkill: Array<{ skill: string; correct: number; total: number }>;
  startedAt: string;
  completedAt: string | null;
  method: string;
}

const METHOD =
  'Each task has one correct answer from a curated key. Nothing you write is run as code. The score is correct answers out of all tasks; tasks left unanswered when you finish count as incorrect.';

const normalise = (s: string) =>
  s
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
const NUMBER = /^-?\d+(?:\.\d+)?$/;

/** Compares a response with a key. Text: case and spacing ignored; numbers compared as numbers. */
export function isCorrect(key: AnswerKey, response: string | number): boolean {
  if (key.type === 'choice' || key.type === 'line') return response === key.correct;
  const given = normalise(String(response));
  return key.accepted.some(accepted => {
    const expected = normalise(accepted);
    if (NUMBER.test(given) && NUMBER.test(expected)) return Number(given) === Number(expected);
    return given === expected;
  });
}

const describeAnswer = (key: AnswerKey): string =>
  key.type === 'choice' ? key.options[key.correct] : key.type === 'line' ? `Line ${key.correct}` : key.accepted[0];

/** Validates the shape of a response for a task's answer type. */
function checkResponse(task: AssessmentTask, response: unknown): string | number {
  const key = task.answer;
  if (key.type === 'choice') {
    if (!Number.isInteger(response) || (response as number) < 0 || (response as number) >= key.options.length) {
      throw new AppError(`Invalid request: response must be an option index from 0 to ${key.options.length - 1}`, 400, 'VALIDATION_ERROR');
    }
    return response as number;
  }
  if (key.type === 'line') {
    const lines = task.code.split('\n').length;
    if (!Number.isInteger(response) || (response as number) < 1 || (response as number) > lines) {
      throw new AppError(`Invalid request: response must be a line number from 1 to ${lines}`, 400, 'VALIDATION_ERROR');
    }
    return response as number;
  }
  if (typeof response !== 'string' || !response.trim() || response.length > MAX_TEXT_ANSWER) {
    throw new AppError(`Invalid request: response must be text of 1 to ${MAX_TEXT_ANSWER} characters`, 400, 'VALIDATION_ERROR');
  }
  return response.trim();
}

/** Deterministic order from a seed, so the same attempt always lists tasks the same way. */
function seededShuffle<T>(items: T[], seed: string): T[] {
  const rank = (x: T, i: number) => crypto.createHash('sha256').update(`${seed}:${i}:${JSON.stringify(x)}`).digest('hex');
  return items.map((x, i) => ({ x, r: rank(x, i) })).sort((a, b) => a.r.localeCompare(b.r)).map(p => p.x);
}

export function viewOf(doc: ITechnicalAssessment): AssessmentView {
  const tasks: TaskView[] = doc.items.map(item => {
    const task = TASKS_BY_ID.get(item.taskId);
    if (!task) {
      // A task retired from the bank after this attempt: keep the result, without the text
      return {
        taskId: item.taskId,
        kind: item.kind as TaskKind,
        skill: item.skill,
        language: 'javascript',
        difficulty: 'medium',
        prompt: 'This task has been retired from the question bank.',
        code: '',
        answerType: 'text',
        answered: item.response !== undefined,
        response: item.response,
        correct: item.correct,
      };
    }
    const answered = item.response !== undefined;
    return {
      taskId: task.id,
      kind: task.kind,
      skill: task.skill,
      language: task.language,
      difficulty: task.difficulty,
      prompt: task.prompt,
      code: task.code,
      tables: task.kind === 'sql' ? SQL_TABLES : undefined,
      answerType: task.answer.type,
      options: task.answer.type === 'choice' ? task.answer.options : undefined,
      lineCount: task.answer.type === 'line' ? task.code.split('\n').length : undefined,
      answered,
      ...(answered
        ? { response: item.response, correct: item.correct, correctAnswer: describeAnswer(task.answer), explanation: task.explanation }
        : {}),
    };
  });

  const skills = [...new Set(doc.items.map(i => i.skill))];
  return {
    id: String(doc._id),
    status: doc.status,
    filters: { skills: doc.filters?.skills ?? [], kinds: doc.filters?.kinds ?? [] },
    tasks,
    progress: { answered: doc.items.filter(i => i.response !== undefined).length, total: doc.items.length },
    score: doc.score ? { answered: doc.score.answered, correct: doc.score.correct, total: doc.score.total, percent: doc.score.percent } : null,
    bySkill: skills.map(skill => {
      const items = doc.items.filter(i => i.skill === skill);
      return { skill, correct: items.filter(i => i.correct === true).length, total: items.length };
    }),
    startedAt: doc.startedAt.toISOString(),
    completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    method: METHOD,
  };
}

class TechnicalAssessmentService {
  catalog() {
    const count = <K extends string>(key: (t: AssessmentTask) => K) =>
      ASSESSMENT_BANK.reduce<Record<string, number>>((acc, t) => ({ ...acc, [key(t)]: (acc[key(t)] ?? 0) + 1 }), {});
    return { skills: count(t => t.skill), kinds: count(t => t.kind), total: ASSESSMENT_BANK.length, maxTasks: MAX_TASKS };
  }

  private async owned(userId: string, id: string): Promise<ITechnicalAssessment> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Assessment not found.', 404, 'ASSESSMENT_NOT_FOUND');
    const doc = await TechnicalAssessment.findOne({ _id: id, userId });
    if (!doc) throw new AppError('Assessment not found.', 404, 'ASSESSMENT_NOT_FOUND');
    return doc;
  }

  async start(userId: string, input: { skills?: string[]; kinds?: TaskKind[]; count?: number }): Promise<AssessmentView> {
    const count = Math.min(MAX_TASKS, Math.max(MIN_TASKS, input.count ?? 5));
    const skills = input.skills ?? [];
    const kinds = input.kinds ?? [];
    const eligible = ASSESSMENT_BANK.filter(t => (!skills.length || skills.includes(t.skill)) && (!kinds.length || kinds.includes(t.kind)));
    if (eligible.length === 0) throw new AppError('No tasks match these skills and kinds.', 400, 'NO_TASKS');

    // Prefer tasks not seen in the last two attempts, then fill with seen ones if needed
    const recent = await TechnicalAssessment.find({ userId }).sort({ createdAt: -1 }).limit(2).select('items.taskId').lean();
    const seen = new Set(recent.flatMap(r => r.items.map(i => i.taskId)));
    const attempts = await TechnicalAssessment.countDocuments({ userId });
    const seed = `${userId}:${attempts}`;
    const ordered = [...seededShuffle(eligible.filter(t => !seen.has(t.id)), seed), ...seededShuffle(eligible.filter(t => seen.has(t.id)), seed)];
    const chosen = ordered.slice(0, count);

    const doc = await TechnicalAssessment.create({
      userId,
      status: 'active',
      filters: { skills, kinds },
      items: chosen.map(t => ({ taskId: t.id, kind: t.kind, skill: t.skill })),
      startedAt: new Date(),
    });
    return viewOf(doc);
  }

  async list(userId: string): Promise<AssessmentView[]> {
    const docs = await TechnicalAssessment.find({ userId }).sort({ createdAt: -1 }).limit(20);
    return docs.map(viewOf);
  }

  async get(userId: string, id: string): Promise<AssessmentView> {
    return viewOf(await this.owned(userId, id));
  }

  async answer(userId: string, id: string, taskId: string, response: unknown): Promise<AssessmentView> {
    const doc = await this.owned(userId, id);
    if (doc.status !== 'active') throw new AppError('This assessment is finished.', 409, 'ASSESSMENT_COMPLETED');
    const item = doc.items.find(i => i.taskId === taskId);
    const task = TASKS_BY_ID.get(taskId);
    if (!item || !task) throw new AppError('Task not found in this assessment.', 404, 'TASK_NOT_FOUND');
    if (item.response !== undefined) throw new AppError('This task has already been answered.', 409, 'ALREADY_ANSWERED');

    const value = checkResponse(task, response);
    item.response = value;
    item.correct = isCorrect(task.answer, value);
    item.answeredAt = new Date();
    doc.markModified('items');
    if (doc.items.every(i => i.response !== undefined)) this.complete(doc);
    await doc.save();
    return viewOf(doc);
  }

  async finish(userId: string, id: string): Promise<AssessmentView> {
    const doc = await this.owned(userId, id);
    if (doc.status === 'completed') return viewOf(doc);
    this.complete(doc);
    await doc.save();
    return viewOf(doc);
  }

  private complete(doc: ITechnicalAssessment) {
    const answered = doc.items.filter(i => i.response !== undefined).length;
    const correct = doc.items.filter(i => i.correct === true).length;
    const total = doc.items.length;
    doc.status = 'completed';
    doc.completedAt = new Date();
    doc.score = { answered, correct, total, percent: total ? Math.round((correct / total) * 100) : 0 };
  }
}

export default new TechnicalAssessmentService();
