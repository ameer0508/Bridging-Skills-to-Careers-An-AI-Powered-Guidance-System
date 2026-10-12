import MarketOpportunityService from './market/MarketOpportunityService.js';
import { MARKET_SUMMARY_CONTRACT_VERSION, type MarketOpportunitySummary } from './market/MarketOpportunitySummary.js';
import logger from '../config/logger.js';

/**
 * How the Career Lab reads labour-market evidence for a career. It consumes the market module's
 * MarketOpportunitySummary (contract version 2) and decides one thing: may a posting count be
 * shown, or is the honest answer "unavailable" and why.
 *
 * A count is shown only for genuinely sourced, sufficient and fresh records. In every other case
 * no number is given at all, so "unavailable" can never be read as "zero openings". Market
 * evidence is about postings; it never enters match or readiness scores, which are about the
 * person.
 */
export type MarketEvidenceState =
  | 'sourced_valid' // genuine, sufficient and fresh: the count may be shown
  | 'no_source' // no licensed market source is registered
  | 'sparse' // sourced, but too few postings or too few months
  | 'stale' // sourced, but collected too long ago
  | 'synthetic' // generated test data; never shown as demand
  | 'error'; // the summary could not be produced

export interface CareerMarketEvidence {
  state: MarketEvidenceState;
  /** True only for 'sourced_valid'. */
  usable: boolean;
  /** Short text for the comparison table. */
  label: string;
  detail: string;
  /** Present only when usable. */
  evidence: null | {
    distinctPostings: number;
    monthsWithPostings: number;
    location: string;
    period: { from: string; to: string };
    sources: Array<{ name: string; licence: string; postings: number }>;
    latestRetrievedAt: string | null;
    ageDays: number | null;
    matchingRule: string;
  };
  contractVersion: number | null;
}

const unavailable = (state: Exclude<MarketEvidenceState, 'sourced_valid'>, detail: string, contractVersion: number | null): CareerMarketEvidence => ({
  state,
  usable: false,
  label: 'Market data unavailable',
  detail,
  evidence: null,
  contractVersion
});

/** Turns a market summary into what the Career Lab may show. Anything unexpected is unavailable. */
export function classifyMarketSummary(summary: MarketOpportunitySummary | null | undefined): CareerMarketEvidence {
  if (!summary) return unavailable('error', 'Market evidence could not be loaded.', null);
  const version = summary.contractVersion ?? null;
  if (version !== MARKET_SUMMARY_CONTRACT_VERSION) {
    return unavailable('error', 'Market evidence was returned in a format this page does not understand.', version);
  }
  const reasons = summary.insufficientDataReasons || [];
  if (summary.dataset !== 'sourced' || summary.evidenceClass === 'synthetic_test_data' || reasons.includes('synthetic_test_data')) {
    return unavailable('synthetic', 'Only generated test data exists. It does not describe real jobs and is not shown as demand.', version);
  }
  if (summary.evidenceClass === 'no_legitimate_source') {
    return unavailable('no_source', 'No licensed job-market source is connected, so there are no postings to count.', version);
  }
  if (reasons.includes('stale_data')) {
    return unavailable('stale', 'The sourced postings were collected too long ago to describe the market now.', version);
  }
  const valid =
    summary.evidenceClass === 'sourced_valid' && summary.usableForRecommendations === true && summary.available === true && summary.distinctPostings > 0 && summary.demand !== null && reasons.length === 0;
  if (!valid) {
    return unavailable('sparse', 'Too few dated postings from a licensed source match this career to report a figure.', version);
  }
  return {
    state: 'sourced_valid',
    usable: true,
    label: `${summary.distinctPostings} postings`,
    detail: `${summary.distinctPostings} distinct postings in ${summary.location.label}, ${summary.period.from} to ${summary.period.to}.`,
    evidence: {
      distinctPostings: summary.distinctPostings,
      monthsWithPostings: summary.demand!.monthly.filter(m => m.postings > 0).length,
      location: summary.location.label,
      period: summary.period,
      sources: summary.sources.map(s => ({ name: s.name, licence: s.licence, postings: s.postings })),
      latestRetrievedAt: summary.freshness.latestRetrievedAt,
      ageDays: summary.freshness.ageDays,
      matchingRule: summary.matchingRule || ''
    },
    contractVersion: version
  };
}

const month = (date: Date): string => date.toISOString().slice(0, 7);

/** The twelve months ending with the current one. */
export function defaultMarketPeriod(now: Date = new Date()): { from: string; to: string } {
  return { from: month(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1))), to: month(now) };
}

/**
 * Market evidence for several careers at once. Always asks for sourced records: the dataset is
 * fixed here and cannot be chosen by a client, so generated data cannot reach a comparison.
 * A failure for one career leaves the others intact.
 */
export async function marketEvidenceForCareers(careers: Array<{ id: string; title: string }>, now: Date = new Date()): Promise<Map<string, CareerMarketEvidence>> {
  const period = defaultMarketPeriod(now);
  const results = await Promise.all(
    careers.map(async career => {
      try {
        return classifyMarketSummary(await MarketOpportunityService.summaryForCareer(career, { dataset: 'sourced', ...period }, now));
      } catch (error) {
        logger.error(`Market summary failed for career ${career.id}: ${error instanceof Error ? error.message : String(error)}`);
        return classifyMarketSummary(null);
      }
    })
  );
  return new Map(careers.map((career, index) => [career.id, results[index]]));
}
