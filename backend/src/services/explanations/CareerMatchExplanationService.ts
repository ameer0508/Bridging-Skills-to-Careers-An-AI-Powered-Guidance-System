import mongoose from 'mongoose';
import { CareerMatch } from '../../models/CareerMatch.js';
import type { CareerMatchExplanationFacts, ExplanationStatusCounts } from '../AIClientService.js';
import ExplanationService, { cleanName, hashFacts as hashWithVersion, stableStringify, type ExplanationDto } from './ExplanationService.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * The career-match subject of the local-AI explanations (Phase 1 of docs/AI_EXPLANATIONS.md).
 *
 * The stored match is the source of truth. The facts sent to the model are built here, on the
 * server, from that record only. Caching, staleness, the shared lock and failure labels are the
 * shared ExplanationService.
 */

// Part of the hash: a change to how facts are built makes every saved explanation out of date
const FACTS_VERSION = 'career-match-facts-v1';
const MAX_REQUIREMENTS = 40;
const TOP_MISSING = 5;
const IMPORTANCE_ORDER = { required: 0, preferred: 1, supporting: 2 } as const;

type Importance = keyof typeof IMPORTANCE_ORDER;
type Status = 'applied' | 'listed' | 'inferred' | 'missing';

export { stableStringify, type ExplanationDto };

interface BreakdownRow {
  skillName: string;
  importance: string;
  status: string;
  pointsPossible?: number;
}

export function hashFacts(facts: CareerMatchExplanationFacts): string {
  return hashWithVersion(facts, FACTS_VERSION);
}

/**
 * The minimal fact sheet for one match: exact score, evidence share, each requirement's importance
 * and status, the counts by importance and the missing requirements with the most points at stake.
 * Returns null when the match has no requirement breakdown to explain.
 */
export function buildCareerMatchFacts(
  match: { matchScore: number; confidence: number; breakdown?: BreakdownRow[] },
  careerTitle: string
): CareerMatchExplanationFacts | null {
  const rows = (match.breakdown || [])
    .filter(r => r && typeof r.skillName === 'string' && r.importance in IMPORTANCE_ORDER)
    .map(r => ({
      skill: cleanName(r.skillName),
      importance: r.importance as Importance,
      status: (['applied', 'listed', 'inferred'].includes(r.status) ? r.status : 'missing') as Status,
      points: Number(r.pointsPossible) || 0,
    }))
    .filter(r => r.skill.length > 0);
  if (rows.length === 0 || rows.length > MAX_REQUIREMENTS) return null;

  rows.sort((a, b) =>
    IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance] || b.points - a.points || a.skill.localeCompare(b.skill));

  const counts = (importance: Importance): ExplanationStatusCounts => {
    const group = rows.filter(r => r.importance === importance);
    return {
      total: group.length,
      applied: group.filter(r => r.status === 'applied').length,
      listed: group.filter(r => r.status === 'listed').length,
      inferred: group.filter(r => r.status === 'inferred').length,
      missing: group.filter(r => r.status === 'missing').length,
    };
  };

  return {
    career_title: cleanName(careerTitle) || 'this career',
    match_score: Math.round(match.matchScore),
    evidence_share_percent: Math.round(match.confidence),
    requirements: rows.map(({ skill, importance, status }) => ({ skill, importance, status })),
    required: counts('required'),
    preferred: counts('preferred'),
    supporting: counts('supporting'),
    top_missing: rows.filter(r => r.status === 'missing').slice(0, TOP_MISSING).map(r => r.skill),
  };
}

ExplanationService.register('career_match', {
  aiPath: 'career-match',
  factsVersion: FACTS_VERSION,
  notFound: { message: 'Career match not found.', code: 'MATCH_NOT_FOUND' },
  noEvidenceMessage: 'This match has no requirement-by-requirement evidence to explain yet.',
  async build(uid: mongoose.Types.ObjectId, cid: mongoose.Types.ObjectId) {
    // Only the signed-in user's own match: another user's id simply finds nothing
    const match = await CareerMatch.findOne({ userId: uid, careerId: cid })
      .populate<{ careerId: { title?: string } }>('careerId', 'title')
      .lean();
    if (!match) throw new AppError('Career match not found.', 404, 'MATCH_NOT_FOUND');
    return buildCareerMatchFacts(match as unknown as { matchScore: number; confidence: number; breakdown?: BreakdownRow[] },
      match.careerId?.title || '') as unknown as Record<string, unknown> | null;
  },
});

/** The career-match subject, as the Phase 1 routes call it. */
export default {
  get: (userId: string, careerId: string) => ExplanationService.get('career_match', userId, careerId),
  generate: (userId: string, careerId: string) => ExplanationService.generate('career_match', userId, careerId),
};
