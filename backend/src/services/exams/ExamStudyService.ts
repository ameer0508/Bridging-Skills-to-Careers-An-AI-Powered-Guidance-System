import ExamAttempt from '../../models/ExamAttempt.js';
import ExamStudyPlan, { IExamStudyPlan, IStudyPlanItem } from '../../models/ExamStudyPlan.js';
import { ExamDefinition, topicsOf } from '../../seed/exams/examDefinitions.js';
import { examOrThrow } from './ExamPracticeService.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Topic performance, recommendations and study plans for the exam pilots (E4).
 *
 * - Topic status needs at least MIN_ATTEMPTS_FOR_STATUS answered questions on the topic:
 *   strength (accuracy ≥ 75%), weakness (< 50%), developing otherwise; below that it is
 *   'insufficient' and no label is given.
 * - Recommendations put a weak or untried prerequisite (SkillBridge's study order) before the
 *   topic that depends on it.
 * - A plan spreads SkillBridge's hour estimates over the user's weekly hours. Regenerating keeps
 *   every completed item and re-plans only what is pending. Hours are effort estimates for study,
 *   not a prediction of any exam result.
 */

export const MIN_ATTEMPTS_FOR_STATUS = 3;
export const STRENGTH_ACCURACY = 0.75;
export const WEAKNESS_ACCURACY = 0.5;

export type TopicStatus = 'strength' | 'developing' | 'weakness' | 'insufficient' | 'not_practised';

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  sectionId: string;
  sectionName: string;
  attempted: number;
  correct: number;
  wrong: number;
  unanswered: number;
  marks: number;
  accuracy: number | null;
  status: TopicStatus;
  lastPractisedAt: string | null;
}

export function topicStatus(attempted: number, accuracy: number | null): TopicStatus {
  if (attempted === 0) return 'not_practised';
  if (attempted < MIN_ATTEMPTS_FOR_STATUS || accuracy === null) return 'insufficient';
  if (accuracy >= STRENGTH_ACCURACY) return 'strength';
  if (accuracy < WEAKNESS_ACCURACY) return 'weakness';
  return 'developing';
}

export interface AttemptItemLike {
  topicId: string;
  outcome?: 'correct' | 'wrong' | 'unanswered';
  marksAwarded?: number;
  completedAt: Date;
}

export function aggregateTopics(exam: ExamDefinition, items: AttemptItemLike[]): TopicPerformance[] {
  return topicsOf(exam).map(t => {
    const mine = items.filter(i => i.topicId === t.id);
    const correct = mine.filter(i => i.outcome === 'correct').length;
    const wrong = mine.filter(i => i.outcome === 'wrong').length;
    const attempted = correct + wrong;
    const accuracy = attempted ? Math.round((correct / attempted) * 100) / 100 : null;
    const last = mine.reduce<Date | null>((acc, i) => (!acc || i.completedAt > acc ? i.completedAt : acc), null);
    return {
      topicId: t.id,
      topicName: t.name,
      sectionId: t.sectionId,
      sectionName: t.sectionName,
      attempted,
      correct,
      wrong,
      unanswered: mine.length - attempted,
      marks: Math.round(mine.reduce((s, i) => s + (i.marksAwarded ?? 0), 0) * 100) / 100,
      accuracy,
      status: topicStatus(attempted, accuracy),
      lastPractisedAt: last ? last.toISOString() : null,
    };
  });
}

export interface Recommendation {
  topicId: string;
  topicName: string;
  action: 'study_prerequisite' | 'practise_weak_topic' | 'start_topic' | 'practise_more';
  reason: string;
}

export function recommend(exam: ExamDefinition, performance: TopicPerformance[], limit = 5): Recommendation[] {
  const byId = new Map(performance.map(p => [p.topicId, p]));
  const topics = new Map(topicsOf(exam).map(t => [t.id, t]));
  const out: Recommendation[] = [];
  const push = (r: Recommendation) => {
    if (!out.some(x => x.topicId === r.topicId)) out.push(r);
  };
  const evidence = (p: TopicPerformance) => `${p.correct} of ${p.attempted} correct`;

  const weak = performance.filter(p => p.status === 'weakness').sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
  for (const p of weak) {
    for (const prereqId of topics.get(p.topicId)?.prerequisites ?? []) {
      const pre = byId.get(prereqId);
      if (pre && (pre.status === 'weakness' || pre.status === 'not_practised')) {
        push({
          topicId: pre.topicId,
          topicName: pre.topicName,
          action: 'study_prerequisite',
          reason: `${p.topicName} is weak (${evidence(p)}), and SkillBridge's study order puts ${pre.topicName} first, which is ${pre.status === 'weakness' ? `also weak (${evidence(pre)})` : 'not practised yet'}.`,
        });
      }
    }
    push({ topicId: p.topicId, topicName: p.topicName, action: 'practise_weak_topic', reason: `Weakest area: ${evidence(p)}.` });
  }
  for (const p of performance.filter(x => x.status === 'insufficient')) {
    push({ topicId: p.topicId, topicName: p.topicName, action: 'practise_more', reason: `Only ${p.attempted} answered so far; ${MIN_ATTEMPTS_FOR_STATUS} are needed before a strength or weakness is shown.` });
  }
  for (const p of performance.filter(x => x.status === 'not_practised')) {
    const prereqsPending = (topics.get(p.topicId)?.prerequisites ?? []).some(id => byId.get(id)?.status === 'not_practised');
    if (!prereqsPending) push({ topicId: p.topicId, topicName: p.topicName, action: 'start_topic', reason: 'Not practised yet.' });
  }
  return out.slice(0, limit);
}

export interface PlanInputTopic {
  topicId: string;
  sectionId: string;
  estimatedHours: number;
  prerequisites: string[];
  status: TopicStatus;
}

const KIND_FOR: Record<TopicStatus, { kind: IStudyPlanItem['kind']; factor: number; reason: string }> = {
  weakness: { kind: 'learn', factor: 1, reason: 'Weak in practice: full study pass' },
  not_practised: { kind: 'learn', factor: 1, reason: 'Not practised yet: full study pass' },
  insufficient: { kind: 'learn', factor: 0.8, reason: 'Too few answers to judge: study, then practise' },
  developing: { kind: 'practise', factor: 0.5, reason: 'Developing: targeted practice' },
  strength: { kind: 'revise', factor: 0.25, reason: 'A strength in practice: light revision' },
};
const PRIORITY: TopicStatus[] = ['weakness', 'not_practised', 'insufficient', 'developing', 'strength'];

/**
 * Orders topics by need (weakest first) while keeping every prerequisite before its dependants,
 * then fills weeks of `hoursPerWeek`, splitting a topic across weeks when needed. `firstWeek`
 * lets a regenerated plan continue after the weeks already used.
 */
export function buildPlan(topics: PlanInputTopic[], hoursPerWeek: number, firstWeek = 1): Array<Omit<IStudyPlanItem, 'status' | 'completedAt'>> {
  const remaining = [...topics].sort((a, b) => PRIORITY.indexOf(a.status) - PRIORITY.indexOf(b.status));
  const included = new Set(topics.map(t => t.topicId));
  const ordered: PlanInputTopic[] = [];
  const placed = new Set<string>();
  while (remaining.length) {
    // The highest-priority topic whose planned prerequisites are already placed
    const i = remaining.findIndex(t => t.prerequisites.every(p => !included.has(p) || placed.has(p)));
    const [next] = remaining.splice(i === -1 ? 0 : i, 1);
    ordered.push(next);
    placed.add(next.topicId);
  }

  const items: Array<Omit<IStudyPlanItem, 'status' | 'completedAt'>> = [];
  let week = firstWeek;
  let free = hoursPerWeek;
  for (const t of ordered) {
    const rule = KIND_FOR[t.status];
    let hours = Math.max(1, Math.round(t.estimatedHours * rule.factor));
    while (hours > 0) {
      if (free <= 0) {
        week += 1;
        free = hoursPerWeek;
      }
      const chunk = Math.min(hours, free);
      items.push({ topicId: t.topicId, sectionId: t.sectionId, kind: rule.kind, hours: chunk, week, reason: rule.reason });
      hours -= chunk;
      free -= chunk;
    }
  }
  return items;
}

class ExamStudyService {
  async performance(userId: string, examId: string) {
    const exam = examOrThrow(examId);
    const attempts = await ExamAttempt.find({ userId, examId, status: 'completed' }).select('items completedAt').lean();
    const items = attempts.flatMap(a => a.items.map(i => ({ topicId: i.topicId, outcome: i.outcome, marksAwarded: i.marksAwarded, completedAt: a.completedAt as Date })));
    const topics = aggregateTopics(exam, items);
    return {
      examId,
      completedAttempts: attempts.length,
      topics,
      recommendations: recommend(exam, topics),
      thresholds: { minAnswered: MIN_ATTEMPTS_FOR_STATUS, strengthAccuracy: STRENGTH_ACCURACY, weaknessAccuracy: WEAKNESS_ACCURACY },
      caveats: [
        'Based only on SkillBridge practice questions you answered. It is not an official assessment and does not predict an exam score, cut-off or rank.',
        'Practice results are kept separate from your career skill evidence and readiness.',
      ],
    };
  }

  async getPlan(userId: string, examId: string) {
    examOrThrow(examId);
    const plan = await ExamStudyPlan.findOne({ userId, examId });
    return plan ? this.planView(plan) : null;
  }

  async generatePlan(userId: string, examId: string, input: { hoursPerWeek: number; startDate?: string }) {
    const exam = examOrThrow(examId);
    const performance = await this.performance(userId, examId);
    const existing = await ExamStudyPlan.findOne({ userId, examId });
    const startDate = input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : existing?.startDate ?? new Date(new Date().toISOString().slice(0, 10));
    if (Number.isNaN(startDate.getTime())) throw new AppError('Invalid request: startDate is not a valid date', 400, 'VALIDATION_ERROR');

    // Completed items are kept exactly; a topic finished in the plan is only planned again if it is still weak
    const done = (existing?.items ?? []).filter(i => i.status === 'done');
    const doneTopics = new Set(done.map(i => i.topicId));
    const status = new Map(performance.topics.map(t => [t.topicId, t.status]));
    const pendingTopics: PlanInputTopic[] = topicsOf(exam)
      .filter(t => !doneTopics.has(t.id) || status.get(t.id) === 'weakness')
      .map(t => ({ topicId: t.id, sectionId: t.sectionId, estimatedHours: t.estimatedHours, prerequisites: t.prerequisites, status: status.get(t.id) ?? 'not_practised' }));
    const firstWeek = done.length ? Math.max(...done.map(i => i.week)) + 1 : 1;
    const fresh = buildPlan(pendingTopics, input.hoursPerWeek, firstWeek).map(i => ({ ...i, status: 'pending' as const, completedAt: null }));

    const plan = existing ?? new ExamStudyPlan({ userId, examId, regenerations: -1 });
    plan.syllabusVersion = exam.syllabusVersion;
    plan.hoursPerWeek = input.hoursPerWeek;
    plan.startDate = startDate;
    plan.items = [...done, ...fresh] as typeof plan.items;
    plan.generatedAt = new Date();
    plan.regenerations = (plan.regenerations ?? -1) + 1;
    await plan.save();
    return this.planView(plan);
  }

  async setItemStatus(userId: string, examId: string, itemId: string, status: 'pending' | 'done') {
    examOrThrow(examId);
    const plan = await ExamStudyPlan.findOne({ userId, examId });
    if (!plan) throw new AppError('There is no study plan for this exam yet.', 404, 'PLAN_NOT_FOUND');
    const item = plan.items.find(i => String(i._id) === itemId);
    if (!item) throw new AppError('Plan item not found.', 404, 'PLAN_ITEM_NOT_FOUND');
    item.status = status;
    item.completedAt = status === 'done' ? new Date() : null;
    plan.markModified('items');
    await plan.save();
    return this.planView(plan);
  }

  private planView(plan: IExamStudyPlan) {
    const exam = examOrThrow(plan.examId);
    const names = new Map(topicsOf(exam).map(t => [t.id, t.name]));
    const weeks = plan.items.length ? Math.max(...plan.items.map(i => i.week)) : 0;
    const pendingHours = plan.items.filter(i => i.status === 'pending').reduce((s, i) => s + i.hours, 0);
    const doneHours = plan.items.filter(i => i.status === 'done').reduce((s, i) => s + i.hours, 0);
    const weekStart = (week: number) => new Date(plan.startDate.getTime() + (week - 1) * 7 * 86_400_000).toISOString().slice(0, 10);
    return {
      examId: plan.examId,
      syllabusVersion: plan.syllabusVersion,
      hoursPerWeek: plan.hoursPerWeek,
      startDate: plan.startDate.toISOString().slice(0, 10),
      generatedAt: plan.generatedAt.toISOString(),
      regenerations: plan.regenerations,
      totals: { weeks, pendingHours, doneHours, estimatedEndDate: weeks ? weekStart(weeks + 1) : null },
      items: plan.items.map(i => ({
        id: String(i._id),
        topicId: i.topicId,
        topicName: names.get(i.topicId) ?? i.topicId,
        sectionId: i.sectionId,
        kind: i.kind,
        hours: i.hours,
        week: i.week,
        weekStarts: weekStart(i.week),
        reason: i.reason,
        status: i.status,
        completedAt: i.completedAt ? i.completedAt.toISOString() : null,
      })),
      caveats: [
        'Hours are SkillBridge estimates for a first study pass, not official figures. They plan your time; they do not predict an exam result.',
        'Regenerating keeps everything you marked done and re-plans the rest from your latest practice results.',
      ],
    };
  }
}

export default new ExamStudyService();
