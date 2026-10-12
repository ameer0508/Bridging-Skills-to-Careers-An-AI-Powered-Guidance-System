/**
 * MarketOpportunitySummary: the contract through which Career Lab comparison and, later,
 * next-best-action ranking read labour-market evidence for a career (docs/MARKET_INTELLIGENCE.md §4).
 *
 * Rules every producer must keep:
 *  - Built from sourced records only; synthetic fixtures never produce a summary.
 *  - Counts are distinct postings actually held; nothing is estimated, scaled or filled in.
 *  - `demand` is null unless the history meets HISTORY_MINIMUMS; the reasons say why.
 *  - There is no opportunity score. Consumers must keep readiness (about the person) separate
 *    from these figures (about postings).
 */
import { HISTORY_MINIMUMS, InsufficiencyReason } from './MarketHistoryService.js';

export const MARKET_SUMMARY_CONTRACT_VERSION = 1 as const;

export type SummaryInsufficiencyReason =
  | InsufficiencyReason
  | 'career_not_mapped_to_postings'
  | 'stale_data';

export interface MarketOpportunitySummary {
  contractVersion: typeof MARKET_SUMMARY_CONTRACT_VERSION;
  careerId: string;
  careerTitle: string;
  /** country null means all countries held. */
  location: { country: string | null; label: string };
  /** Inclusive months, YYYY-MM. */
  period: { from: string; to: string };
  dataset: 'sourced';
  /** How postings were attributed to this career, in words, so the figure can be checked. */
  matchingRule: string | null;
  /** Every time a matching posting was seen, re-observations included. */
  sourcedObservations: number;
  distinctPostings: number;
  sources: Array<{ id: string; name: string; licence: string; postings: number }>;
  freshness: { latestPostedAt: string | null; latestRetrievedAt: string | null; ageDays: number | null };
  /** Present only when the history is sufficient. */
  demand: null | {
    monthly: Array<{ month: string; postings: number }>;
    minimums: typeof HISTORY_MINIMUMS;
  };
  available: boolean;
  insufficientDataReasons: SummaryInsufficiencyReason[];
}

/** The honest answer when no summary can be given: zero counts, no demand, and the reasons. */
export function unavailableSummary(
  career: { id: string; title: string },
  period: { from: string; to: string },
  reasons: SummaryInsufficiencyReason[],
  country: string | null = null
): MarketOpportunitySummary {
  if (reasons.length === 0) throw new Error('An unavailable summary needs at least one reason');
  return {
    contractVersion: MARKET_SUMMARY_CONTRACT_VERSION,
    careerId: career.id,
    careerTitle: career.title,
    location: { country, label: country ?? 'All countries' },
    period,
    dataset: 'sourced',
    matchingRule: null,
    sourcedObservations: 0,
    distinctPostings: 0,
    sources: [],
    freshness: { latestPostedAt: null, latestRetrievedAt: null, ageDays: null },
    demand: null,
    available: false,
    insufficientDataReasons: reasons,
  };
}
