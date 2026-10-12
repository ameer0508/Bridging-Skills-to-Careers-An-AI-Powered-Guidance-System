/**
 * Market signals (C5) and market-aware adaptation (R4): typed, dated facts about postings for one
 * career, with provenance, and a contract for consumers such as next-best-action ranking
 * (docs/MARKET_INTELLIGENCE.md §4a).
 *
 * Rules:
 *  - Signals describe postings. They never describe the applicant; readiness stays a separate
 *    input owned by the consumer and is not read here.
 *  - There is no score, weight or boost. The only effect a consumer may give a signal is the
 *    documented tie-break in `compareWithMarketTieBreak`.
 *  - Influence is 'neutral' unless the evidence is sourced, sufficient, fresh and consistent
 *    across sources. Synthetic, sparse, stale, missing or conflicting evidence is neutral.
 */
import { getMarketSource, listMarketSources, MarketDataset } from '../../config/marketSources.js';
import MarketPosting from '../../models/MarketPosting.js';
import { monthRange } from './MarketHistoryService.js';
import MarketOpportunityService, { careerTitlePattern } from './MarketOpportunityService.js';
import { EvidenceClass, MarketOpportunitySummary, SummaryInsufficiencyReason } from './MarketOpportunitySummary.js';
import MarketSkillTrendService from './MarketSkillTrendService.js';

export const MARKET_SIGNAL_CONTRACT_VERSION = 1 as const;

export const DIRECTION_MINIMUMS = {
  /** Postings in each half of the period before a direction is stated. */
  postingsPerHalf: 15,
  /** |z| of the two-period Poisson comparison needed to call a change. */
  zThreshold: 1.96,
} as const;

export type DemandDirection = 'rising' | 'falling' | 'stable';

export type NeutralReason =
  | SummaryInsufficiencyReason
  | 'too_few_for_direction'
  | 'conflicting_sources';

export interface DemandDirectionResult {
  direction: DemandDirection | null;
  earlier: { months: string[]; postings: number };
  recent: { months: string[]; postings: number };
  z: number | null;
}

export interface SourceDirection {
  sourceId: string;
  name: string;
  licence: string;
  direction: DemandDirection | null;
  earlierPostings: number;
  recentPostings: number;
}

export interface SkillSignal {
  skill: string;
  /** Share of dated postings in the period mentioning the skill; null when there are none. */
  share: number | null;
  mentions: number;
  postings: number;
  change: 'higher_share' | 'lower_share' | 'no_clear_change' | null;
  usable: boolean;
}

export type MarketInfluence =
  | { mode: 'neutral'; reasons: NeutralReason[] }
  | { mode: 'evidence'; demandDirection: DemandDirection | null; distinctPostings: number; asOf: string };

export interface MarketSignals {
  contractVersion: typeof MARKET_SIGNAL_CONTRACT_VERSION;
  careerId: string;
  careerTitle: string;
  dataset: MarketDataset;
  evidenceClass: EvidenceClass;
  period: { from: string; to: string };
  location: { country: string | null };
  /** When the signals were computed and the latest retrieval they rest on. */
  generatedAt: string;
  dataAsOf: string | null;
  demand: {
    distinctPostings: number;
    direction: DemandDirectionResult;
    bySource: SourceDirection[];
  };
  skills: SkillSignal[];
  provenance: {
    matchingRule: string | null;
    sources: Array<{ id: string; name: string; licence: string; url: string; postings: number }>;
  };
  influence: MarketInfluence;
  /** Stated so no consumer merges the two. */
  separation: string;
}

const SEPARATION = 'Market signals describe job postings held from registered sources. They say nothing about the applicant; readiness is a separate input and must not be combined with these into one score.';

/**
 * Compares the earlier and recent halves of the period (the middle month is dropped when the count
 * is odd). The comparison is a two-period Poisson test: z = (recent - earlier) / sqrt(recent + earlier).
 */
export function demandDirection(monthly: Array<{ month: string; postings: number }>): DemandDirectionResult {
  const half = Math.floor(monthly.length / 2);
  const earlierMonths = monthly.slice(0, half);
  const recentMonths = monthly.slice(monthly.length - half);
  const earlier = earlierMonths.reduce((s, m) => s + m.postings, 0);
  const recent = recentMonths.reduce((s, m) => s + m.postings, 0);
  const base = {
    earlier: { months: earlierMonths.map(m => m.month), postings: earlier },
    recent: { months: recentMonths.map(m => m.month), postings: recent },
  };
  if (half === 0 || earlier < DIRECTION_MINIMUMS.postingsPerHalf || recent < DIRECTION_MINIMUMS.postingsPerHalf) {
    return { direction: null, z: null, ...base };
  }
  const z = (recent - earlier) / Math.sqrt(recent + earlier);
  const direction: DemandDirection = z >= DIRECTION_MINIMUMS.zThreshold ? 'rising' : z <= -DIRECTION_MINIMUMS.zThreshold ? 'falling' : 'stable';
  return { direction, z: Math.round(z * 100) / 100, ...base };
}

/** True when two sources each state a direction and they point opposite ways. */
export function sourcesConflict(bySource: SourceDirection[]): boolean {
  const stated = new Set(bySource.map(s => s.direction).filter((d): d is DemandDirection => d !== null));
  return stated.has('rising') && stated.has('falling');
}

/** The influence a consumer may use. Anything short of valid, consistent evidence is neutral. */
export function marketInfluence(
  summary: Pick<MarketOpportunitySummary, 'evidenceClass' | 'usableForRecommendations' | 'insufficientDataReasons' | 'distinctPostings'>,
  direction: DemandDirectionResult,
  bySource: SourceDirection[],
  dataAsOf: string | null
): MarketInfluence {
  if (!summary.usableForRecommendations || summary.evidenceClass !== 'sourced_valid') {
    const reasons: NeutralReason[] = summary.insufficientDataReasons.length ? [...summary.insufficientDataReasons] : ['no_registered_source'];
    return { mode: 'neutral', reasons };
  }
  if (sourcesConflict(bySource)) return { mode: 'neutral', reasons: ['conflicting_sources'] };
  return { mode: 'evidence', demandDirection: direction.direction, distinctPostings: summary.distinctPostings, asOf: dataAsOf ?? '' };
}

const DIRECTION_RANK: Record<DemandDirection, number> = { rising: 1, stable: 0, falling: -1 };

/**
 * The integration contract for ranking consumers (R3/R4). Use it only as the last comparison,
 * after the consumer's own ordering says two items are tied:
 *
 *   items.sort((a, b) => ownOrder(a, b) || compareWithMarketTieBreak(a.market, b.market))
 *
 * It returns 0 unless both items carry evidence with a stated direction, so neutral, missing or
 * undetermined signals never change any order, and a market signal can never move an item past one
 * the consumer ranked differently.
 */
export function compareWithMarketTieBreak(a: MarketInfluence | null | undefined, b: MarketInfluence | null | undefined): number {
  if (a?.mode !== 'evidence' || b?.mode !== 'evidence' || !a.demandDirection || !b.demandDirection) return 0;
  return DIRECTION_RANK[b.demandDirection] - DIRECTION_RANK[a.demandDirection];
}

export interface SignalQuery {
  dataset: MarketDataset;
  country?: string;
  from: string;
  to: string;
  /** Canonical skill names, e.g. the applicant's gaps; at most 10. */
  skills?: string[];
}

const nextMonthStart = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 1));
};

class MarketSignalService {
  async signalsForCareer(career: { id: string; title: string }, query: SignalQuery, now = new Date()): Promise<MarketSignals> {
    const summary = await MarketOpportunityService.summaryForCareer(career, query, now);
    const monthly = summary.demand?.monthly ?? monthRange(query.from, query.to).map(month => ({ month, postings: 0 }));
    const sourcedRegistered = listMarketSources().some(s => s.dataset === query.dataset);

    // Per-source monthly counts, under the same matching rule as the summary
    let bySource: SourceDirection[] = [];
    if (sourcedRegistered && summary.distinctPostings > 0) {
      const match: Record<string, unknown> = {
        dataset: query.dataset,
        title: careerTitlePattern(career.title),
        postedAt: { $gte: new Date(`${query.from}-01T00:00:00.000Z`), $lt: nextMonthStart(query.to) },
      };
      if (query.country) match.country = query.country;
      const rows = await MarketPosting.aggregate<{ _id: { source: string; month: string }; postings: number }>([
        { $match: match },
        { $group: { _id: { source: '$sourceId', month: { $dateToString: { format: '%Y-%m', date: '$postedAt' } } }, postings: { $sum: 1 } } },
      ]);
      const months = monthRange(query.from, query.to);
      const sources = [...new Set(rows.map(r => r._id.source))].sort();
      bySource = sources.map(sourceId => {
        const counts = new Map(rows.filter(r => r._id.source === sourceId).map(r => [r._id.month, r.postings]));
        const d = demandDirection(months.map(month => ({ month, postings: counts.get(month) ?? 0 })));
        const meta = getMarketSource(sourceId);
        return {
          sourceId,
          name: meta?.name ?? sourceId,
          licence: meta?.licence ?? 'unknown (source no longer registered)',
          direction: d.direction,
          earlierPostings: d.earlier.postings,
          recentPostings: d.recent.postings,
        };
      });
    }

    const direction = summary.evidenceClass === 'sourced_valid' ? demandDirection(monthly) : demandDirection([]);
    const dataAsOf = summary.freshness.latestRetrievedAt;
    const influence = marketInfluence(summary, direction, bySource, dataAsOf);

    // Skill signals carry the same gate: only valid, sourced evidence is usable
    let skills: SkillSignal[] = [];
    if (query.skills?.length && sourcedRegistered) {
      const trends = await MarketSkillTrendService.trends({
        dataset: query.dataset,
        country: query.country,
        from: query.from,
        to: query.to,
        granularity: 'month',
        skills: query.skills,
        limit: query.skills.length,
      });
      skills = trends.skills.map(t => ({
        skill: t.skill,
        share: t.share,
        mentions: t.mentions,
        postings: trends.totals.distinctPostings,
        change: t.change.described ? t.change.direction : null,
        usable: influence.mode === 'evidence' && t.change.described,
      }));
    }

    return {
      contractVersion: MARKET_SIGNAL_CONTRACT_VERSION,
      careerId: career.id,
      careerTitle: career.title,
      dataset: query.dataset,
      evidenceClass: summary.evidenceClass,
      period: { from: query.from, to: query.to },
      location: { country: query.country ?? null },
      generatedAt: now.toISOString(),
      dataAsOf,
      demand: { distinctPostings: summary.distinctPostings, direction, bySource },
      skills,
      provenance: {
        matchingRule: summary.matchingRule,
        sources: summary.sources.map(s => ({ ...s, url: getMarketSource(s.id)?.url ?? '' })),
      },
      influence,
      separation: SEPARATION,
    };
  }
}

export default new MarketSignalService();
