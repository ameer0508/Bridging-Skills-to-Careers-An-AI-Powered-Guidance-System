/**
 * MarketOpportunitySummary: the contract through which Career Lab comparison and, later,
 * next-best-action ranking read labour-market evidence for a career (docs/MARKET_INTELLIGENCE.md §4).
 *
 * Rules every producer keeps:
 *  - `evidenceClass` says what the figures rest on. Only 'sourced_valid' may inform real
 *    user-facing recommendations (`usableForRecommendations`).
 *  - Counts are distinct postings actually held; nothing is estimated, scaled or filled in.
 *  - `demand` is null unless the sourced history meets HISTORY_MINIMUMS and is fresh.
 *  - There is no opportunity score. Readiness (about the person) stays separate from these
 *    figures (about postings).
 */
import { MarketDataset } from '../../config/marketSources.js';
import { HISTORY_MINIMUMS, InsufficiencyReason } from './MarketHistoryService.js';

export const MARKET_SUMMARY_CONTRACT_VERSION = 2 as const;

/** Sourced records older than this (by latest retrieval) are stale. */
export const STALE_AFTER_DAYS = 90;

export type SummaryInsufficiencyReason =
  | InsufficiencyReason
  | 'career_not_mapped_to_postings'
  | 'stale_data'
  | 'synthetic_test_data';

export type EvidenceClass =
  /** Sourced, sufficient and fresh: may inform real recommendations. */
  | 'sourced_valid'
  /** Sourced, but too few, too narrow or too old: counts only. */
  | 'sourced_sparse'
  /** No licensed source is registered: nothing real exists to summarise. */
  | 'no_legitimate_source'
  /** Generated fixture data: for tests and demonstrations only. */
  | 'synthetic_test_data';

export interface MarketOpportunitySummary {
  contractVersion: typeof MARKET_SUMMARY_CONTRACT_VERSION;
  careerId: string;
  careerTitle: string;
  /** country null means all countries held. */
  location: { country: string | null; label: string };
  /** Inclusive months, YYYY-MM. */
  period: { from: string; to: string };
  dataset: MarketDataset;
  evidenceClass: EvidenceClass;
  usableForRecommendations: boolean;
  /** How postings were attributed to this career, in words, so the figure can be checked. */
  matchingRule: string | null;
  /** Every time a matching posting was seen, re-observations included. */
  sourcedObservations: number;
  distinctPostings: number;
  sources: Array<{ id: string; name: string; licence: string; postings: number }>;
  freshness: { latestPostedAt: string | null; latestRetrievedAt: string | null; ageDays: number | null };
  /** Present only for 'sourced_valid'. */
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
    evidenceClass: 'no_legitimate_source',
    usableForRecommendations: false,
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
