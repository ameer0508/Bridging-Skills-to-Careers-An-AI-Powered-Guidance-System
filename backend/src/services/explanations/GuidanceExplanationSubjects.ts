import mongoose from 'mongoose';
import { CareerMatch } from '../../models/CareerMatch.js';
import { CareerReadiness } from '../../models/CareerReadiness.js';
import { GapAnalysis, type IGapItem } from '../../models/GapAnalysis.js';
import ExplanationService, { cleanName } from './ExplanationService.js';
import NextBestActionService from '../NextBestActionService.js';
import { summarizeNextAction, summarizeReadiness, summarizeSkillGaps } from './summaries.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Phase 2 subjects of the local-AI explanations (docs/AI_EXPLANATIONS.md): readiness, skill gaps and
 * the next-best action. Each fact sheet is built here from the signed-in user's own stored records;
 * the deterministic engines remain the only source of scores, tiers, gaps and rankings.
 */

interface BreakdownRow {
  skillName: string;
  importance: string;
  status: string;
  pointsPossible?: number;
}

const DIMENSIONS = ['Technical Skills', 'Professional Experience', 'Project Portfolio', 'Education & Certifications'];

/** The readiness engine's tier bands (ReadinessCalculator), so a fact sheet's tier always matches its score. */
export function readinessTier(score: number): string {
  if (score >= 75) return 'Strong evidence';
  if (score >= 50) return 'Solid foundation';
  if (score >= 25) return 'Developing';
  return 'Early stage';
}

/** Missing required skills, most points at stake first. */
function missingRequired(breakdown: BreakdownRow[]): string[] {
  return breakdown
    .filter(r => r.importance === 'required' && r.status === 'missing')
    .sort((a, b) => (Number(b.pointsPossible) || 0) - (Number(a.pointsPossible) || 0) || a.skillName.localeCompare(b.skillName))
    .map(r => cleanName(r.skillName))
    .filter(Boolean);
}

export async function buildReadinessFacts(uid: mongoose.Types.ObjectId, cid: mongoose.Types.ObjectId): Promise<Record<string, unknown> | null> {
  const readiness = await CareerReadiness.findOne({ userId: uid, careerId: cid })
    .populate<{ careerId: { title?: string } }>('careerId', 'title')
    .lean();
  if (!readiness) throw new AppError('Readiness not found.', 404, 'READINESS_NOT_FOUND');
  const match = await CareerMatch.findOne({ userId: uid, careerId: cid }).select('breakdown').lean();
  const breakdown = (match?.breakdown ?? []) as BreakdownRow[];
  const dimensions = (readiness.dimensions ?? []).filter(d => DIMENSIONS.includes(d.name));
  if (breakdown.length === 0 || dimensions.length !== DIMENSIONS.length) return null;

  const score = Math.round(readiness.overallScore);
  const basis = readiness.evidenceBasis;
  const shares = basis && basis.assessed !== null && basis.assessed !== undefined
    ? { assessed: basis.assessed, self_reported: basis.selfReported, stated: basis.stated, inferred: basis.inferred }
    : { assessed: null, self_reported: null, stated: null, inferred: null };
  return {
    career_title: cleanName(readiness.careerId?.title || '') || 'this career',
    readiness_score: score,
    tier: readinessTier(score),
    dimensions: DIMENSIONS.map(name => {
      const d = dimensions.find(x => x.name === name)!;
      return { name, score: Math.round(d.score), weight_percent: Math.round(d.weight * 100) };
    }),
    required_total: breakdown.filter(r => r.importance === 'required').length,
    required_missing_skills: missingRequired(breakdown),
    requirements_total: basis?.requirementsTotal ?? breakdown.length,
    requirements_covered: basis?.requirementsCovered ?? breakdown.filter(r => r.status !== 'missing').length,
    requirements_assessed: basis?.requirementsAssessed ?? 0,
    evidence_shares: shares,
  };
}

ExplanationService.register('readiness', {
  aiPath: 'readiness',
  factsVersion: 'readiness-facts-v1',
  notFound: { message: 'Readiness not found.', code: 'READINESS_NOT_FOUND' },
  noEvidenceMessage: 'This readiness result has no requirement evidence to explain yet.',
  build: buildReadinessFacts,
  summarize: summarizeReadiness,
});

const MAX_GAPS = 15;
const MAX_STRENGTHS = 10;

/**
 * The gap prioritiser's stored gaps with each skill's importance and status from the stored match:
 * missing required skills first, then the others, each by impact. Null when there is no gap.
 */
export async function buildSkillGapFacts(uid: mongoose.Types.ObjectId, cid: mongoose.Types.ObjectId): Promise<Record<string, unknown> | null> {
  const analysis = await GapAnalysis.findOne({ userId: uid, careerId: cid })
    .populate<{ careerId: { title?: string } }>('careerId', 'title')
    .lean();
  if (!analysis) throw new AppError('Skill gaps not found.', 404, 'GAPS_NOT_FOUND');
  const match = await CareerMatch.findOne({ userId: uid, careerId: cid }).select('breakdown').lean();
  const rows = new Map(((match?.breakdown ?? []) as BreakdownRow[]).map(r => [r.skillName.trim().toLowerCase(), r]));

  const seen = new Set<string>();
  const gaps = [...analysis.criticalGaps, ...analysis.weakAreas]
    .map((item: IGapItem, index) => {
      const row = rows.get(item.skillName.trim().toLowerCase());
      const critical = index < analysis.criticalGaps.length;
      const importance = (row?.importance as 'required' | 'preferred' | 'supporting' | undefined) ?? (critical ? 'required' : 'preferred');
      const kind = importance === 'required' && row && row.status !== 'missing' ? 'limited_evidence' : 'missing';
      return { skill: cleanName(item.skillName), importance, kind, impact: Math.round(item.impactScore) };
    })
    .filter(g => g.skill && !seen.has(g.skill.toLowerCase()) && seen.add(g.skill.toLowerCase()));
  if (gaps.length === 0) return null;
  // Stable sort by impact only: ties keep the prioritiser's own order, exactly as the pages show it
  const byImpact = (a: { impact: number }, b: { impact: number }) => b.impact - a.impact;
  const isCritical = (g: { importance: string; kind: string }) => g.importance === 'required' && g.kind === 'missing';
  const ordered = [...gaps.filter(isCritical).sort(byImpact), ...gaps.filter(g => !isCritical(g)).sort(byImpact)].slice(0, MAX_GAPS);
  const strengths = analysis.strengthAreas
    .map(item => ({ skill: cleanName(item.skillName), impact: Math.round(item.impactScore) }))
    .filter(sk => sk.skill && !seen.has(sk.skill.toLowerCase()) && seen.add(sk.skill.toLowerCase()))
    .sort(byImpact)
    .slice(0, MAX_STRENGTHS);
  return { career_title: cleanName(analysis.careerId?.title || '') || 'this career', gaps: ordered, strengths };
}

ExplanationService.register('skill_gap', {
  aiPath: 'skill-gap',
  factsVersion: 'skill-gap-facts-v1',
  notFound: { message: 'Skill gaps not found.', code: 'GAPS_NOT_FOUND' },
  noEvidenceMessage: 'No skill gap is recorded for this career, so there is nothing to explain.',
  build: buildSkillGapFacts,
  summarize: summarizeSkillGaps,
});

const MAX_ACTION_SKILLS = 6;

/**
 * Effort as the engine gives it, in whole minutes under two hours and whole hours otherwise.
 * approximate is true when rounding changed a figure (e.g. a 15-minute check plus 10 hours of
 * learning is 10.25 hours), so the wording can say "about" instead of presenting it as exact.
 */
export function effortFact(effort: { low: number; high: number; basis: 'time limit' | 'assumption' }) {
  const minutes = effort.high < 2;
  const scale = minutes ? 60 : 1;
  const low = Math.round(effort.low * scale);
  const high = Math.round(effort.high * scale);
  const approximate = Math.abs(low - effort.low * scale) > 1e-9 || Math.abs(high - effort.high * scale) > 1e-9;
  return { low, high, unit: minutes ? 'minutes' : 'hours', basis: effort.basis, approximate };
}

/**
 * The first-ranked next action for a career, exactly as the ranking returns it (the same service the
 * dashboard shows). Only for a career the user has a match for. Null when there is no action.
 */
export async function buildNextActionFacts(uid: mongoose.Types.ObjectId, cid: mongoose.Types.ObjectId): Promise<Record<string, unknown> | null> {
  const owned = await CareerMatch.exists({ userId: uid, careerId: cid });
  if (!owned) throw new AppError('Career match not found.', 404, 'MATCH_NOT_FOUND');
  const ranked = await NextBestActionService.forUser(uid.toString(), cid.toString());
  const top = ranked.actions[0];
  if (!ranked.hasProfile || !ranked.career || !top) return null;
  const skills: string[] = [];
  for (const s of top.skills.map(cleanName)) if (s && !skills.some(x => x.toLowerCase() === s.toLowerCase())) skills.push(s);
  const kept = skills.slice(0, MAX_ACTION_SKILLS);
  const capacity = top.factors.capacity;
  return {
    career_title: cleanName(ranked.career.title) || 'this career',
    action_title: cleanName(top.title),
    kind: top.kind,
    skills: kept,
    rank: 1,
    total_actions: ranked.totalCandidates,
    score_before: top.factors.scoreBefore,
    score_after: top.factors.scoreAfter,
    impact: top.factors.impact,
    required_gaps_addressed: Math.min(top.factors.requiredGapsAddressed, kept.length),
    needs_learning_first: top.factors.needsLearningFirst.map(cleanName).filter(s => kept.includes(s)),
    effort: effortFact(top.factors.effortHours),
    hours_per_week: capacity.hoursPerWeek ?? null,
    weeks_low: capacity.weeks?.low ?? null,
    weeks_high: capacity.weeks?.high ?? null,
    fits_two_weeks: capacity.hoursPerWeek ? capacity.fitsTwoWeeks : null,
  };
}

ExplanationService.register('next_action', {
  aiPath: 'next-action',
  factsVersion: 'next-action-facts-v1',
  notFound: { message: 'Career match not found.', code: 'MATCH_NOT_FOUND' },
  noEvidenceMessage: 'There is no next action to explain for this career right now.',
  build: buildNextActionFacts,
  summarize: summarizeNextAction,
});
