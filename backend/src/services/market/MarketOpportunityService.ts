import { getMarketSource, listMarketSources, MarketDataset } from '../../config/marketSources.js';
import MarketPosting from '../../models/MarketPosting.js';
import { escapeRegExp } from '../../utils/skillLexicon.js';
import { HISTORY_MINIMUMS, monthRange } from './MarketHistoryService.js';
import {
  MARKET_SUMMARY_CONTRACT_VERSION,
  MarketOpportunitySummary,
  STALE_AFTER_DAYS,
  SummaryInsufficiencyReason,
  unavailableSummary,
} from './MarketOpportunitySummary.js';

export interface SummaryQuery {
  dataset: MarketDataset;
  country?: string;
  from: string;
  to: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Produces a MarketOpportunitySummary for one career (C5 producer). A posting is attributed to a
 * career when its title contains the career title as whole words, case-insensitively: the rule is
 * stated in every summary so the count can be checked. It is deliberately narrow; titles that use
 * other words for the same job are not counted.
 */
class MarketOpportunityService {
  matchingRule(careerTitle: string): string {
    return `Posting title contains "${careerTitle}" as whole words (case-insensitive).`;
  }

  async summaryForCareer(career: { id: string; title: string }, query: SummaryQuery, now = new Date()): Promise<MarketOpportunitySummary> {
    const period = { from: query.from, to: query.to };
    const country = query.country ?? null;

    if (query.dataset === 'sourced' && !listMarketSources().some(s => s.dataset === 'sourced')) {
      return unavailableSummary(career, period, ['no_registered_source'], country);
    }

    const titlePattern = new RegExp(`(^|[^A-Za-z0-9])${escapeRegExp(career.title.trim())}($|[^A-Za-z0-9])`, 'i');
    const [ty, tm] = query.to.split('-').map(Number);
    const match: Record<string, unknown> = {
      dataset: query.dataset,
      title: titlePattern,
      postedAt: { $gte: new Date(`${query.from}-01T00:00:00.000Z`), $lt: new Date(Date.UTC(ty, tm, 1)) },
    };
    if (country) match.country = country;

    const [byMonth, bySource, totals] = await Promise.all([
      MarketPosting.aggregate<{ _id: string; postings: number }>([
        { $match: match },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$postedAt' } }, postings: { $sum: 1 } } },
      ]),
      MarketPosting.aggregate<{ _id: string; postings: number }>([
        { $match: match },
        { $group: { _id: '$sourceId', postings: { $sum: 1 } } },
      ]),
      MarketPosting.aggregate<{ observations: number; latestPostedAt: Date | null; latestRetrievedAt: Date | null }>([
        { $match: match },
        {
          $group: {
            _id: null,
            observations: { $sum: '$observationCount' },
            latestPostedAt: { $max: '$postedAt' },
            latestRetrievedAt: { $max: '$lastSeenAt' },
          },
        },
      ]),
    ]);

    const counts = new Map(byMonth.map(m => [m._id, m.postings]));
    const monthly = monthRange(query.from, query.to).map(month => ({ month, postings: counts.get(month) ?? 0 }));
    const distinctPostings = monthly.reduce((s, m) => s + m.postings, 0);
    const monthsWithPostings = monthly.filter(m => m.postings > 0).length;
    const latestRetrievedAt = totals[0]?.latestRetrievedAt ? new Date(totals[0].latestRetrievedAt) : null;
    const ageDays = latestRetrievedAt ? Math.floor((now.getTime() - latestRetrievedAt.getTime()) / DAY_MS) : null;

    const reasons: SummaryInsufficiencyReason[] = [];
    if (query.dataset === 'synthetic_fixture') reasons.push('synthetic_test_data');
    if (distinctPostings === 0) reasons.push('career_not_mapped_to_postings');
    else {
      if (distinctPostings < HISTORY_MINIMUMS.distinctPostings) reasons.push('too_few_postings');
      if (monthsWithPostings < HISTORY_MINIMUMS.monthsWithPostings) reasons.push('too_few_months_with_postings');
      if (ageDays !== null && ageDays > STALE_AFTER_DAYS) reasons.push('stale_data');
    }

    const evidenceClass =
      query.dataset === 'synthetic_fixture' ? 'synthetic_test_data' : reasons.length === 0 ? 'sourced_valid' : 'sourced_sparse';
    const valid = evidenceClass === 'sourced_valid';

    return {
      contractVersion: MARKET_SUMMARY_CONTRACT_VERSION,
      careerId: career.id,
      careerTitle: career.title,
      location: { country, label: country ?? 'All countries' },
      period,
      dataset: query.dataset,
      evidenceClass,
      usableForRecommendations: valid,
      matchingRule: this.matchingRule(career.title),
      sourcedObservations: totals[0]?.observations ?? 0,
      distinctPostings,
      sources: bySource
        .map(s => ({
          id: s._id,
          name: getMarketSource(s._id)?.name ?? s._id,
          licence: getMarketSource(s._id)?.licence ?? 'unknown (source no longer registered)',
          postings: s.postings,
        }))
        .sort((a, b) => b.postings - a.postings),
      freshness: {
        latestPostedAt: totals[0]?.latestPostedAt ? new Date(totals[0].latestPostedAt).toISOString() : null,
        latestRetrievedAt: latestRetrievedAt ? latestRetrievedAt.toISOString() : null,
        ageDays,
      },
      demand: valid ? { monthly, minimums: HISTORY_MINIMUMS } : null,
      available: valid,
      insufficientDataReasons: reasons,
    };
  }
}

export default new MarketOpportunityService();
