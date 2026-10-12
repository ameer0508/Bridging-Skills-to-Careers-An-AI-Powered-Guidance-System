import mongoose from 'mongoose';
import InterviewSession from '../../models/InterviewSession.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Historical interview performance (D6); see docs/INTERVIEWS.md.
 *
 * Only like is compared with like:
 *  - Dimensions (relevance, completeness, specificity, structure, technical accuracy) are measured
 *    the same way under every rubric, so they are compared across rubrics, but never across
 *    scoring sources: the rule-based rubric is capped and cannot judge accuracy, so AI-scored and
 *    rule-scored sessions are separate series. Sessions scored by both ('mixed') are listed but
 *    left out of every series.
 *  - Overall scores depend on the rubric's weights, so they are compared only within one scoring
 *    source and one rubric.
 *  - A direction is stated only with at least MIN_SESSIONS_FOR_TREND sessions, by comparing the
 *    mean of the earlier half with the recent half (the middle session is dropped when the count is
 *    odd), and only when the difference is at least CHANGE_THRESHOLD points.
 */

export const MIN_SESSIONS_FOR_TREND = 3;
export const CHANGE_THRESHOLD = 10;
export const MAX_SESSIONS = 50;
export const DIMENSIONS = ['relevance', 'completeness', 'specificity', 'structure', 'technicalAccuracy'] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export interface ProgressSessionInput {
  id: string;
  completedAt: Date;
  mode: string;
  rubricId: string;
  evaluationSource: string | null;
  overallScore: number;
  answeredCount: number;
  plannedCount: number;
  dimensionScores: Partial<Record<Dimension, number | null>>;
}

export interface Trend {
  sessions: number;
  first: number | null;
  latest: number | null;
  earlierMean: number | null;
  recentMean: number | null;
  change: number | null;
  direction: 'improved' | 'declined' | 'no_clear_change' | null;
  /** Latest minus the session before it; null with fewer than two. */
  latestVsPrevious: number | null;
  reason: 'too_few_sessions' | null;
}

export interface SeriesPoint {
  sessionId: string;
  completedAt: string;
  value: number;
}

export interface SourceSeries {
  evaluationSource: 'ai' | 'heuristic';
  sessions: Array<{ id: string; completedAt: string; mode: string; rubricId: string; overallScore: number; answered: number; planned: number }>;
  dimensions: Record<Dimension, { points: SeriesPoint[]; trend: Trend }>;
  overallByRubric: Array<{ rubricId: string; points: SeriesPoint[]; trend: Trend }>;
}

export interface InterviewProgress {
  sessionsConsidered: number;
  excluded: { mixedScoring: number; nothingAnswered: number };
  series: SourceSeries[];
  minimums: { sessionsForTrend: number; changeThreshold: number };
  caveats: string[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

export function trendOf(values: number[]): Trend {
  const n = values.length;
  const base: Trend = {
    sessions: n,
    first: n ? values[0] : null,
    latest: n ? values[n - 1] : null,
    earlierMean: null,
    recentMean: null,
    change: null,
    direction: null,
    latestVsPrevious: n >= 2 ? values[n - 1] - values[n - 2] : null,
    reason: null,
  };
  if (n < MIN_SESSIONS_FOR_TREND) return { ...base, reason: 'too_few_sessions' };
  const half = Math.floor(n / 2);
  const earlier = mean(values.slice(0, half));
  const recent = mean(values.slice(n - half));
  const change = round1(recent - earlier);
  return {
    ...base,
    earlierMean: round1(earlier),
    recentMean: round1(recent),
    change,
    direction: change >= CHANGE_THRESHOLD ? 'improved' : change <= -CHANGE_THRESHOLD ? 'declined' : 'no_clear_change',
  };
}

export function computeProgress(input: ProgressSessionInput[]): InterviewProgress {
  const sessions = [...input].sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
  const nothingAnswered = sessions.filter(s => s.answeredCount === 0).length;
  const answered = sessions.filter(s => s.answeredCount > 0);
  const mixedScoring = answered.filter(s => s.evaluationSource !== 'ai' && s.evaluationSource !== 'heuristic').length;

  const series: SourceSeries[] = (['heuristic', 'ai'] as const)
    .map(source => {
      const group = answered.filter(s => s.evaluationSource === source);
      const dimensions = Object.fromEntries(
        DIMENSIONS.map(dimension => {
          const points = group
            .filter(s => typeof s.dimensionScores[dimension] === 'number')
            .map(s => ({ sessionId: s.id, completedAt: s.completedAt.toISOString(), value: s.dimensionScores[dimension] as number }));
          return [dimension, { points, trend: trendOf(points.map(p => p.value)) }];
        })
      ) as SourceSeries['dimensions'];
      const rubrics = [...new Set(group.map(s => s.rubricId))];
      return {
        evaluationSource: source,
        sessions: group.map(s => ({
          id: s.id,
          completedAt: s.completedAt.toISOString(),
          mode: s.mode,
          rubricId: s.rubricId,
          overallScore: s.overallScore,
          answered: s.answeredCount,
          planned: s.plannedCount,
        })),
        dimensions,
        overallByRubric: rubrics.map(rubricId => {
          const points = group.filter(s => s.rubricId === rubricId).map(s => ({ sessionId: s.id, completedAt: s.completedAt.toISOString(), value: s.overallScore }));
          return { rubricId, points, trend: trendOf(points.map(p => p.value)) };
        }),
      };
    })
    .filter(s => s.sessions.length > 0);

  return {
    sessionsConsidered: answered.length - mixedScoring,
    excluded: { mixedScoring, nothingAnswered },
    series,
    minimums: { sessionsForTrend: MIN_SESSIONS_FOR_TREND, changeThreshold: CHANGE_THRESHOLD },
    caveats: [
      'This compares your own practice sessions with each other. It is not a benchmark against other candidates and does not predict an interview outcome.',
      'Different questions are asked in each session, so part of any change comes from the questions, not from you.',
      'Rule-based and AI scores are kept apart because they are not on the same scale.',
    ],
  };
}

class InterviewProgressService {
  async forUser(userId: string, filters: { mode?: string } = {}): Promise<InterviewProgress> {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId), status: 'completed' };
    if (filters.mode) query.mode = filters.mode;
    const docs = await InterviewSession.find(query).sort({ completedAt: -1 }).limit(MAX_SESSIONS).lean();
    return computeProgress(
      docs.map(d => ({
        id: String(d._id),
        completedAt: new Date(d.completedAt ?? d.updatedAt),
        mode: d.mode,
        rubricId: d.rubricId ?? 'general',
        evaluationSource: d.evaluationSource ?? null,
        overallScore: d.overallScore ?? 0,
        answeredCount: d.answeredCount ?? 0,
        plannedCount: (d.questions || []).filter(q => !q.followUpOf).length,
        dimensionScores: (d.dimensionScores ?? {}) as ProgressSessionInput['dimensionScores'],
      }))
    );
  }
}

export default new InterviewProgressService();
