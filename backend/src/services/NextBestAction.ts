import type { ICareerRequirement } from '../models/CareerRequirement.js';
import CareerScoringEngine from './CareerScoringEngine.js';
import CareerScenarioService, { asEngineInput, type ScenarioChange, type ScenarioSkill } from './CareerScenarioService.js';
import { practisedGaps } from './ProjectSuggestionService.js';
import { ASSESSMENT_POLICY, assessableSkill } from './SkillAssessmentService.js';
import { EFFORT_ASSUMPTIONS } from './RoadmapScheduler.js';
import { PROJECT_BRIEFS } from '../seed/projectBriefs.js';
import type { CareerMarketEvidence } from './CareerMarketEvidence.js';

/**
 * Next-best-action ranking (research contribution R3).
 *
 * Every candidate action is something that would add evidence: passing a skill check, doing a
 * practice project, or recording a finished project in the portfolio. Each is evaluated by
 * re-scoring the profile with the shared scoring engine, so "impact" is the same hypothetical
 * score change the Career Lab reports. The ranking is a fixed, documented formula over the
 * factors below. Nothing is learned from data and nothing is random: the same profile always
 * gives the same order.
 *
 * Market demand is a declared factor with no data behind it yet. It is held at zero weight, so
 * unknown demand neither helps nor hurts an action.
 */

/** Chosen weights, in match-score points. Not fitted to any data. */
export const NBA_WEIGHTS = {
  /** Per required requirement the action addresses that is not yet shown in use (at most two counted). */
  requiredGap: 4,
  /** When the action fits into two weeks of the user's stated hours. Zero when no hours are set. */
  fitsCapacity: 3,
  /** Taken off when a skill must be learnt before the action can be done. */
  needsLearningFirst: 2,
  /** No market data exists; the factor is neutral. */
  market: 0
} as const;

export type ActionKind = 'verify' | 'project' | 'portfolio';

export interface NextActionInput {
  skills: ScenarioSkill[];
  requirements: ICareerRequirement[];
  requirementKeys: Set<string>;
  hoursPerWeek: number | null;
  /** Skills already verified by a skill check. */
  verifiedSkills: string[];
  /** Practice projects taken on, by brief id. */
  briefStatus: Record<string, string>;
  /** Practice projects marked complete that are not in the portfolio yet. */
  unpublishedProjects: Array<{ id: string; title: string; skills: string[] }>;
  /** Market evidence for the career, when it was looked up. Absent means unknown. */
  market?: CareerMarketEvidence | null;
}

export interface RankedAction {
  id: string;
  kind: ActionKind;
  title: string;
  /** Requirement skills of the career this action adds evidence for. */
  skills: string[];
  /** In-app path where the action is taken. */
  link: string;
  changes: ScenarioChange[];
  score: number;
  rank: number;
  /** Position under the baseline that orders by gap importance only. */
  baselineRank: number;
  factors: {
    /** Hypothetical change in the career's match score, from the shared engine. */
    impact: number;
    scoreBefore: number;
    scoreAfter: number;
    requiredGapsAddressed: number;
    /** Mean evidence score (0-100) the user already has for the skills; 0 for a skill not on the profile. */
    existingEvidence: number;
    /** Skills that are not on the profile at all and must be learnt before the action. */
    needsLearningFirst: string[];
    effortHours: { low: number; high: number; basis: 'time limit' | 'assumption' };
    capacity: { hoursPerWeek: number | null; weeks: { low: number; high: number } | null; fitsTwoWeeks: boolean | null };
    market: MarketFactor;
  };
  reasons: string[];
}

/**
 * The market factor of an action. Its weight is 0 in every case: market demand does not move the
 * ranking. `eligible` records whether the evidence would be allowed to, which is only when it is
 * valid, fresh and genuinely sourced. Even then the value is carried for display and audit only,
 * until a normalisation is agreed and documented (docs/NEXTGEN_RESEARCH.md, R3).
 */
export interface MarketFactor {
  /** Distinct sourced postings for the career, only when eligible; otherwise null. */
  value: number | null;
  weight: 0;
  eligible: boolean;
  state: string;
  note: string;
}

export function marketFactor(market: CareerMarketEvidence | null | undefined): MarketFactor {
  if (market?.usable && market.state === 'sourced_valid' && market.evidence) {
    return {
      value: market.evidence.distinctPostings,
      weight: NBA_WEIGHTS.market,
      eligible: true,
      state: market.state,
      note: `${market.evidence.distinctPostings} sourced postings exist for this career. They are shown for information; market demand does not affect this ranking yet.`
    };
  }
  return {
    value: null,
    weight: NBA_WEIGHTS.market,
    eligible: false,
    state: market?.state ?? 'not_looked_up',
    note: 'No market data is available, so demand does not affect this ranking.'
  };
}

const key = (name: string): string => name.trim().toLowerCase();
const IMPORTANCE_ORDER: Record<string, number> = { required: 3, preferred: 2, supporting: 1 };
const LEARN = EFFORT_ASSUMPTIONS['Learning Resources'];

interface Candidate {
  id: string;
  kind: ActionKind;
  title: string;
  skills: string[];
  link: string;
  changes: ScenarioChange[];
  effort: { low: number; high: number; basis: 'time limit' | 'assumption' };
}

export function rankNextActions(input: NextActionInput): { scoreNow: number; actions: RankedAction[] } {
  const base = CareerScoringEngine.calculateScore(input.requirements, asEngineInput(input.skills));
  const rows = new Map(base.breakdown.map(row => [key(row.skillName), row]));
  const evidenceOf = (skill: string): number => {
    const keys = [key(skill)];
    const found = input.skills.find(s => [s.canonicalName, ...s.aliases].some(n => keys.includes(key(n))));
    return found ? found.evidenceScore : 0;
  };
  const verified = new Set(input.verifiedSkills.map(key));

  const candidates: Candidate[] = [];

  // 1. Skill checks for requirements of this career that have one and are not yet verified
  for (const row of base.breakdown) {
    const skill = assessableSkill(row.skillName);
    if (!skill || verified.has(key(skill))) continue;
    const minutes = ASSESSMENT_POLICY.minutesToComplete / 60;
    candidates.push({
      id: `verify:${skill}`,
      kind: 'verify',
      title: `Take the ${skill} skill check`,
      skills: [row.skillName],
      link: '/career-lab',
      changes: [{ type: 'pass_assessment', skill: row.skillName }],
      effort: { low: minutes, high: minutes, basis: 'time limit' }
    });
  }

  // 2. Practice projects that put not-yet-applied requirements to use
  const gaps = new Map(base.breakdown.filter(row => row.status !== 'applied').map(row => [key(row.skillName), { skillName: row.skillName }]));
  const gain = new Map(
    [...gaps.values()].map(gap => {
      const after = CareerScoringEngine.calculateScore(
        input.requirements,
        asEngineInput(CareerScenarioService.applyChanges(input.skills, [{ type: 'add_project', skills: [gap.skillName] }], input.requirementKeys))
      );
      return [key(gap.skillName), after.totalScore - base.totalScore] as [string, number];
    })
  );
  for (const brief of PROJECT_BRIEFS) {
    const status = input.briefStatus[brief.id];
    if (status === 'completed') continue; // finished ones are offered as portfolio entries below
    const practised = practisedGaps(brief, gaps, gain);
    if (practised.length === 0) continue;
    candidates.push({
      id: `project:${brief.id}`,
      kind: 'project',
      title: `${status ? 'Continue' : 'Do'} the practice project "${brief.title}"`,
      skills: practised.map(g => g.skillName),
      link: '/roadmap',
      changes: [{ type: 'add_project', skills: practised.map(g => g.skillName), name: brief.title }],
      effort: { low: brief.effortHours.low, high: brief.effortHours.high, basis: 'assumption' }
    });
  }

  // 3. Finished practice projects that are not in the portfolio yet
  for (const project of input.unpublishedProjects) {
    const skills = project.skills.filter(skill => rows.has(key(skill)));
    if (skills.length === 0) continue;
    candidates.push({
      id: `portfolio:${project.id}`,
      kind: 'portfolio',
      title: `Add "${project.title}" to your portfolio with a link`,
      skills,
      link: '/portfolio',
      changes: [{ type: 'add_project', skills, name: project.title }],
      effort: { low: 0.5, high: 0.5, basis: 'assumption' }
    });
  }

  const evaluated = candidates.flatMap(candidate => {
    const after = CareerScoringEngine.calculateScore(input.requirements, asEngineInput(CareerScenarioService.applyChanges(input.skills, candidate.changes, input.requirementKeys)));
    const impact = after.totalScore - base.totalScore;
    if (impact <= 0) return [];

    const addressed = candidate.skills.map(skill => rows.get(key(skill))!).filter(Boolean);
    const requiredGapsAddressed = addressed.filter(row => row.importance === 'required' && row.status !== 'applied').length;
    // A portfolio entry records work already done, so nothing has to be learnt first
    const needsLearningFirst = candidate.kind === 'portfolio' ? [] : addressed.filter(row => row.status === 'missing').map(row => row.skillName);
    const effort = {
      low: candidate.effort.low + needsLearningFirst.length * LEARN.low,
      high: candidate.effort.high + needsLearningFirst.length * LEARN.high,
      basis: needsLearningFirst.length > 0 ? ('assumption' as const) : candidate.effort.basis
    };
    const h = input.hoursPerWeek;
    const capacity = {
      hoursPerWeek: h,
      weeks: h ? { low: Math.max(1, Math.ceil(effort.low / h)), high: Math.max(1, Math.ceil(effort.high / h)) } : null,
      fitsTwoWeeks: h ? effort.high <= 2 * h : null
    };
    const score =
      impact +
      NBA_WEIGHTS.requiredGap * Math.min(2, requiredGapsAddressed) +
      (capacity.fitsTwoWeeks ? NBA_WEIGHTS.fitsCapacity : 0) -
      (needsLearningFirst.length > 0 ? NBA_WEIGHTS.needsLearningFirst : 0) +
      // Zero by construction: the weight is 0 whatever the evidence says
      NBA_WEIGHTS.market * (marketFactor(input.market).value ?? 0);

    const reasons = [`Would move the match from ${base.totalScore}% to ${after.totalScore}% (hypothetical).`];
    if (requiredGapsAddressed > 0) reasons.push(`Addresses ${requiredGapsAddressed} required skill${requiredGapsAddressed === 1 ? '' : 's'} you have not yet shown in use.`);
    if (needsLearningFirst.length > 0) reasons.push(`You would need to learn ${needsLearningFirst.join(', ')} first.`);
    if (capacity.fitsTwoWeeks) reasons.push(`Fits into two weeks at your ${h} hours a week.`);
    reasons.push(
      effort.basis === 'time limit'
        ? `Takes at most ${ASSESSMENT_POLICY.minutesToComplete} minutes.`
        : `Assumed effort ${effort.low} to ${effort.high} hours (a planning range, not a measurement).`
    );

    const importance = Math.max(0, ...addressed.map(row => IMPORTANCE_ORDER[row.importance] ?? 0));
    return [
      {
        ...candidate,
        importance,
        score,
        factors: {
          impact,
          scoreBefore: base.totalScore,
          scoreAfter: after.totalScore,
          requiredGapsAddressed,
          existingEvidence: Math.round(candidate.skills.reduce((sum, skill) => sum + evidenceOf(skill), 0) / candidate.skills.length),
          needsLearningFirst,
          effortHours: effort,
          capacity,
          market: marketFactor(input.market)
        },
        reasons
      }
    ];
  });

  // Baseline: gap importance only, with the action id as a fixed tie-break
  const baseline = [...evaluated].sort((a, b) => b.importance - a.importance || a.id.localeCompare(b.id)).map(a => a.id);
  const ranked = [...evaluated].sort((a, b) => b.score - a.score || a.factors.effortHours.high - b.factors.effortHours.high || a.id.localeCompare(b.id));

  return {
    scoreNow: base.totalScore,
    actions: ranked.map(({ importance: _importance, effort: _effort, ...action }, index) => ({ ...action, rank: index + 1, baselineRank: baseline.indexOf(action.id) + 1 }))
  };
}
