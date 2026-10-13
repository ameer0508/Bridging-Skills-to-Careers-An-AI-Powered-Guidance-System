import { getMarketSource, listMarketSources, MarketDataset } from '../../config/marketSources.js';
import { employerDiversity, groupByEmployerStage, type EmployerDiversityReason } from './employerDiversity.js';
import MarketPosting from '../../models/MarketPosting.js';
import { monthRange } from './MarketHistoryService.js';

/**
 * Job-description skill trend mining (C4).
 *
 * Unit of counting: a distinct stored posting (duplicates were merged on import; re-observations
 * never add postings). A skill counts once per posting, whichever alias the text used (skills are
 * canonical lexicon names). The denominator of every share is all dated postings in the same
 * period and filters, including postings in which no known skill was found, so shares of
 * different skills are comparable. Undated postings are excluded and reported.
 *
 * A change over time is described only when both halves of the period hold enough postings and
 * the skill enough mentions, and then only as a difference in share whose size is tested with a
 * two-proportion z-test. Below that, counts are shown with the reasons no trend is stated.
 */

export const TREND_MINIMUMS = {
  /** Dated postings in each half of the period. */
  postingsPerHalf: 30,
  /** Months in the period that hold any posting. */
  monthsWithPostings: 6,
  /** Postings mentioning the skill across the whole period. */
  skillMentions: 10,
  /** |z| at or above this is described as a change (about 95% two-sided). */
  zThreshold: 1.96,
} as const;

export type TrendReason =
  | 'no_registered_source'
  | 'no_records'
  | 'too_few_months_with_postings'
  | 'too_few_postings_per_half'
  | 'too_few_skill_mentions'
  | EmployerDiversityReason;

export type Granularity = 'month' | 'quarter';

export interface SkillTrendQuery {
  dataset: MarketDataset;
  country?: string;
  from: string;
  to: string;
  granularity: Granularity;
  /** Canonical skill names to report; when absent, the most mentioned skills. */
  skills?: string[];
  limit: number;
}

export interface WindowShare {
  months: string[];
  mentions: number;
  postings: number;
  share: number | null;
}

export interface SkillTrend {
  skill: string;
  mentions: number;
  share: number | null;
  byPeriod: Array<{ period: string; mentions: number; postings: number; share: number | null }>;
  change: {
    described: boolean;
    reasons: TrendReason[];
    earlier: WindowShare;
    recent: WindowShare;
    /** recent.share - earlier.share, in percentage points; null when either share is undefined. */
    changePoints: number | null;
    z: number | null;
    direction: 'higher_share' | 'lower_share' | 'no_clear_change' | null;
  };
}

export interface SkillTrends {
  dataset: MarketDataset;
  isSynthetic: boolean;
  query: SkillTrendQuery;
  periods: Array<{ period: string; postings: number }>;
  totals: { distinctPostings: number; undatedExcluded: number; postingsWithoutRecognisedSkills: number; monthsWithPostings: number };
  skills: SkillTrend[];
  sufficiency: { sufficient: boolean; reasons: TrendReason[] };
  minimums: typeof TREND_MINIMUMS;
  sources: Array<{ id: string; name: string; licence: string; postings: number }>;
  caveats: string[];
}

const periodOf = (month: string, granularity: Granularity) => {
  if (granularity === 'month') return month;
  const [y, m] = month.split('-').map(Number);
  return `${y}-Q${Math.ceil(m / 3)}`;
};

const share = (mentions: number, postings: number) => (postings > 0 ? mentions / postings : null);

/** Two-proportion z statistic with a pooled variance; null when it cannot be computed. */
export function twoProportionZ(x1: number, n1: number, x2: number, n2: number): number | null {
  if (n1 === 0 || n2 === 0) return null;
  const pooled = (x1 + x2) / (n1 + n2);
  const variance = pooled * (1 - pooled) * (1 / n1 + 1 / n2);
  if (variance === 0) return null;
  return (x2 / n2 - x1 / n1) / Math.sqrt(variance);
}

class MarketSkillTrendService {
  async trends(query: SkillTrendQuery): Promise<SkillTrends> {
    const months = monthRange(query.from, query.to);
    const half = Math.floor(months.length / 2);
    const earlierMonths = months.slice(0, half);
    const recentMonths = months.slice(months.length - half);

    const base: Record<string, unknown> = { dataset: query.dataset };
    if (query.country) base.country = query.country;
    const start = new Date(`${query.from}-01T00:00:00.000Z`);
    const [ty, tm] = query.to.split('-').map(Number);
    const end = new Date(Date.UTC(ty, tm, 1));
    const dated = { ...base, postedAt: { $gte: start, $lt: end } };
    const monthExpr = { $dateToString: { format: '%Y-%m', date: '$postedAt' } };

    const [postingsByMonth, mentionsByMonth, undatedExcluded, withoutSkills, bySource, byEmployer] = await Promise.all([
      MarketPosting.aggregate<{ _id: string; postings: number }>([
        { $match: dated },
        { $group: { _id: monthExpr, postings: { $sum: 1 } } },
      ]),
      MarketPosting.aggregate<{ _id: { skill: string; month: string }; mentions: number }>([
        { $match: dated },
        // A posting lists each canonical skill once, so one unwound row is one posting
        { $project: { month: monthExpr, skills: { $setUnion: ['$skills', []] } } },
        { $unwind: '$skills' },
        { $group: { _id: { skill: '$skills', month: '$month' }, mentions: { $sum: 1 } } },
      ]),
      MarketPosting.countDocuments({ ...base, postedAt: null }),
      MarketPosting.countDocuments({ ...dated, skills: { $size: 0 } }),
      MarketPosting.aggregate<{ _id: string; postings: number }>([
        { $match: dated },
        { $group: { _id: '$sourceId', postings: { $sum: 1 } } },
      ]),
      MarketPosting.aggregate<{ _id: string; postings: number }>([{ $match: dated }, groupByEmployerStage]),
    ]);
    const employers = employerDiversity(new Map(byEmployer.map(e => [e._id, e.postings])));

    const postingsIn = new Map(postingsByMonth.map(p => [p._id, p.postings]));
    const sumPostings = (ms: string[]) => ms.reduce((s, m) => s + (postingsIn.get(m) ?? 0), 0);
    const distinctPostings = sumPostings(months);
    const monthsWithPostings = months.filter(m => (postingsIn.get(m) ?? 0) > 0).length;

    const periodKeys = [...new Set(months.map(m => periodOf(m, query.granularity)))];
    const periods = periodKeys.map(period => ({
      period,
      postings: sumPostings(months.filter(m => periodOf(m, query.granularity) === period)),
    }));

    const mentions = new Map<string, Map<string, number>>();
    for (const row of mentionsByMonth) {
      if (!mentions.has(row._id.skill)) mentions.set(row._id.skill, new Map());
      mentions.get(row._id.skill)!.set(row._id.month, row.mentions);
    }
    const mentionsIn = (skill: string, ms: string[]) => ms.reduce((s, m) => s + (mentions.get(skill)?.get(m) ?? 0), 0);

    // Period-level reasons apply to every skill
    const reasons: TrendReason[] = [];
    if (!listMarketSources().some(s => s.dataset === query.dataset)) reasons.push('no_registered_source');
    if (distinctPostings === 0) reasons.push('no_records');
    else {
      if (monthsWithPostings < TREND_MINIMUMS.monthsWithPostings) reasons.push('too_few_months_with_postings');
      if (sumPostings(earlierMonths) < TREND_MINIMUMS.postingsPerHalf || sumPostings(recentMonths) < TREND_MINIMUMS.postingsPerHalf) {
        reasons.push('too_few_postings_per_half');
      }
      reasons.push(...employers.reasons);
    }

    const ranked = query.skills?.length
      ? query.skills
      : [...mentions.keys()].sort((a, b) => mentionsIn(b, months) - mentionsIn(a, months) || a.localeCompare(b)).slice(0, query.limit);

    const window = (skill: string, ms: string[]): WindowShare => {
      const postings = sumPostings(ms);
      const count = mentionsIn(skill, ms);
      return { months: ms, mentions: count, postings, share: share(count, postings) };
    };

    const skills: SkillTrend[] = ranked.map(skill => {
      const total = mentionsIn(skill, months);
      const earlier = window(skill, earlierMonths);
      const recent = window(skill, recentMonths);
      const skillReasons = [...reasons];
      if (distinctPostings > 0 && total < TREND_MINIMUMS.skillMentions) skillReasons.push('too_few_skill_mentions');
      const described = skillReasons.length === 0;
      const z = described ? twoProportionZ(earlier.mentions, earlier.postings, recent.mentions, recent.postings) : null;
      const changePoints = described && earlier.share !== null && recent.share !== null ? (recent.share - earlier.share) * 100 : null;
      let direction: SkillTrend['change']['direction'] = null;
      if (described) {
        if (z !== null && z >= TREND_MINIMUMS.zThreshold) direction = 'higher_share';
        else if (z !== null && z <= -TREND_MINIMUMS.zThreshold) direction = 'lower_share';
        else direction = 'no_clear_change';
      }
      return {
        skill,
        mentions: total,
        share: share(total, distinctPostings),
        byPeriod: periods.map(p => {
          const ms = months.filter(m => periodOf(m, query.granularity) === p.period);
          const count = mentionsIn(skill, ms);
          return { period: p.period, mentions: count, postings: p.postings, share: share(count, p.postings) };
        }),
        change: { described, reasons: skillReasons, earlier, recent, changePoints, z, direction },
      };
    });

    const caveats = [
      'A share is postings mentioning the skill divided by all dated postings held for the same period and filters.',
      'A change is the difference between the earlier and the recent half of the period; it is only stated when it passes a two-proportion test (|z| ≥ 1.96).',
      'Skills are found by matching the shared skill list; skills it does not know are not counted.',
    ];
    if (query.dataset === 'synthetic_fixture') caveats.unshift('SYNTHETIC TEST DATA: these shares come from generated postings and describe no real job market.');

    return {
      dataset: query.dataset,
      isSynthetic: query.dataset === 'synthetic_fixture',
      query,
      periods,
      totals: { distinctPostings, undatedExcluded, postingsWithoutRecognisedSkills: withoutSkills, monthsWithPostings },
      skills,
      sufficiency: { sufficient: reasons.length === 0, reasons },
      minimums: TREND_MINIMUMS,
      sources: bySource.map(s => ({
        id: s._id,
        name: getMarketSource(s._id)?.name ?? s._id,
        licence: getMarketSource(s._id)?.licence ?? 'unknown (source no longer registered)',
        postings: s.postings,
      })),
      caveats,
    };
  }
}

export default new MarketSkillTrendService();
