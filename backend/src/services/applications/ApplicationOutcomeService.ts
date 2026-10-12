import { Types } from 'mongoose';
import SavedOpportunity, { ApplicationStatus, IStatusHistoryEntry } from '../../models/SavedOpportunity.js';

/**
 * Application outcome analytics (C6) over one user's own tracked applications.
 *
 * Counting rules (docs/APPLICATION_OUTCOMES.md):
 *  - A saved job is not an application. An application exists from the first "applied" event,
 *    or, when the user skipped that step, from the first interview, offer or rejection
 *    (reported as an inferred application date).
 *  - Each application counts once per stage however often the status moved back and forth.
 *  - The cohort is the applications made in the period; their later outcomes are followed to today.
 *  - Applications to built-in demo listings are left out unless explicitly included.
 *  - Every rate carries its numerator and denominator, and says whether it is measured, based on
 *    too few applications, or impossible because nothing was observed.
 */

export const OUTCOME_MIN_SAMPLE = 5;
export const MAX_OUTCOME_MONTHS = 60;

export type RateStatus = 'no_observations' | 'insufficient_sample' | 'measured';

export interface ConversionRate {
  numerator: number;
  denominator: number;
  /** numerator / denominator, or null when the denominator is zero. */
  rate: number | null;
  status: RateStatus;
}

export interface ApplicationTimeline {
  id: string;
  isSample: boolean;
  currentStatus: ApplicationStatus;
  appliedAt: Date | null;
  appliedInferred: boolean;
  interviewAt: Date | null;
  offerAt: Date | null;
  rejectedAt: Date | null;
  withdrawnAt: Date | null;
  outOfOrder: boolean;
  repeatedTransitions: number;
  milestoneBeforeApplication: boolean;
}

export interface OutcomeQuery {
  /** Inclusive, YYYY-MM; defaults to the month of the first application (at most 60 months back). */
  from?: string;
  /** Inclusive, YYYY-MM; defaults to the current month. */
  to?: string;
  includeDemoListings?: boolean;
}

export interface ApplicationOutcomes {
  period: { from: string; to: string; observedUntil: string };
  scope: {
    includesDemoListings: boolean;
    applicationsInPeriod: number;
    /** Saved jobs that were never applied to: not applications, never counted. */
    savedNotApplied: number;
    demoListingApplicationsExcluded: number;
  };
  funnel: { applied: number; reachedInterview: number; reachedOffer: number; rejected: number; withdrawn: number; stillOpen: number };
  rates: { appliedToInterview: ConversionRate; interviewToOffer: ConversionRate; appliedToOffer: ConversionRate };
  monthly: Array<{ month: string; applications: number; reachedInterview: number; reachedOffer: number }>;
  dataQuality: {
    inferredApplicationDates: number;
    offersWithoutRecordedInterview: number;
    historiesOutOfOrder: number;
    repeatedTransitionsIgnored: number;
    milestonesDatedBeforeApplication: number;
  };
  minimumSample: number;
  caveats: string[];
}

interface TrackedApplication {
  _id: Types.ObjectId | string;
  status: ApplicationStatus;
  statusHistory: IStatusHistoryEntry[];
  appliedAt?: Date | null;
  isSample?: boolean;
}

const validDate = (d: unknown): d is Date => d instanceof Date && !Number.isNaN(d.getTime());
const monthOf = (d: Date) => d.toISOString().slice(0, 7);

/** The dated milestones of one tracked job, read defensively from its status history. */
export function buildTimeline(doc: TrackedApplication): ApplicationTimeline {
  const raw = (doc.statusHistory || []).filter(e => validDate(e.changedAt));
  const outOfOrder = raw.some((e, i) => i > 0 && e.changedAt.getTime() < raw[i - 1].changedAt.getTime());
  const events = [...raw].sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

  let repeatedTransitions = 0;
  const seen = new Set<string>();
  for (const e of events) {
    if (seen.has(e.status)) repeatedTransitions += 1;
    seen.add(e.status);
  }

  const first = (status: ApplicationStatus) => events.find(e => e.status === status)?.changedAt ?? null;
  const interviewAt = first('interviewing');
  const offerAt = first('offer');
  const rejectedAt = first('rejected');
  const withdrawnAt = first('withdrawn');

  let appliedAt: Date | null = validDate(doc.appliedAt) ? doc.appliedAt : first('applied');
  let appliedInferred = false;
  if (!appliedAt) {
    // An interview, offer or rejection means an application was made, even if never recorded.
    // Withdrawing from a saved job does not.
    const implied = [interviewAt, offerAt, rejectedAt].filter(validDate).sort((a, b) => a.getTime() - b.getTime());
    if (implied.length) {
      appliedAt = implied[0];
      appliedInferred = true;
    }
  }

  const milestoneBeforeApplication = Boolean(
    appliedAt && [interviewAt, offerAt, rejectedAt].some(d => d && d.getTime() < (appliedAt as Date).getTime())
  );

  return {
    id: String(doc._id),
    isSample: Boolean(doc.isSample),
    currentStatus: doc.status,
    appliedAt,
    appliedInferred,
    interviewAt,
    offerAt,
    rejectedAt,
    withdrawnAt,
    outOfOrder,
    repeatedTransitions,
    milestoneBeforeApplication,
  };
}

export function conversion(numerator: number, denominator: number, minimum = OUTCOME_MIN_SAMPLE): ConversionRate {
  if (denominator === 0) return { numerator, denominator, rate: null, status: 'no_observations' };
  return {
    numerator,
    denominator,
    rate: numerator / denominator,
    status: denominator < minimum ? 'insufficient_sample' : 'measured',
  };
}

export function monthRange(from: string, to: string): string[] {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const months: string[] = [];
  for (let i = fy * 12 + fm - 1; i <= ty * 12 + tm - 1; i++) {
    months.push(`${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`);
  }
  return months;
}

const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
};

/** Pure computation over already-loaded records, so it can be tested without a database. */
export function computeOutcomes(docs: TrackedApplication[], query: OutcomeQuery = {}, now = new Date()): ApplicationOutcomes {
  const timelines = docs.map(buildTimeline);
  const includeDemo = Boolean(query.includeDemoListings);
  const applications = timelines.filter(t => t.appliedAt);
  const demoExcluded = includeDemo ? 0 : applications.filter(t => t.isSample).length;
  const counted = applications.filter(t => includeDemo || !t.isSample);

  const to = query.to ?? monthOf(now);
  const earliest = counted.reduce<string | null>((min, t) => {
    const m = monthOf(t.appliedAt as Date);
    return !min || m < min ? m : min;
  }, null);
  const defaultFrom = earliest && earliest <= to ? earliest : to;
  const from = query.from ?? (monthRange(defaultFrom, to).length > MAX_OUTCOME_MONTHS ? shiftMonth(to, -(MAX_OUTCOME_MONTHS - 1)) : defaultFrom);

  const inPeriod = (d: Date) => {
    const m = monthOf(d);
    return m >= from && m <= to;
  };
  const cohort = counted.filter(t => inPeriod(t.appliedAt as Date));

  const reachedInterview = cohort.filter(t => t.interviewAt);
  const reachedOffer = cohort.filter(t => t.offerAt);
  const offerAfterInterview = reachedInterview.filter(t => t.offerAt);

  const byMonth = new Map(monthRange(from, to).map(m => [m, { month: m, applications: 0, reachedInterview: 0, reachedOffer: 0 }]));
  for (const t of cohort) {
    const row = byMonth.get(monthOf(t.appliedAt as Date));
    if (!row) continue;
    row.applications += 1;
    if (t.interviewAt) row.reachedInterview += 1;
    if (t.offerAt) row.reachedOffer += 1;
  }

  const caveats = [
    'Counts are your own tracked applications, as you recorded them in SkillBridge.',
    'Applications still open can still lead to an interview or offer, so recent rates may rise.',
    `A rate based on fewer than ${OUTCOME_MIN_SAMPLE} applications is shown with its counts but is too small to compare.`,
  ];
  if (includeDemo) caveats.unshift('Includes applications to built-in demo listings, which are not real vacancies.');

  return {
    period: { from, to, observedUntil: now.toISOString() },
    scope: {
      includesDemoListings: includeDemo,
      applicationsInPeriod: cohort.length,
      savedNotApplied: timelines.filter(t => !t.appliedAt).length,
      demoListingApplicationsExcluded: demoExcluded,
    },
    funnel: {
      applied: cohort.length,
      reachedInterview: reachedInterview.length,
      reachedOffer: reachedOffer.length,
      rejected: cohort.filter(t => t.rejectedAt).length,
      withdrawn: cohort.filter(t => t.withdrawnAt).length,
      stillOpen: cohort.filter(t => t.currentStatus === 'applied' || t.currentStatus === 'interviewing').length,
    },
    rates: {
      appliedToInterview: conversion(reachedInterview.length, cohort.length),
      interviewToOffer: conversion(offerAfterInterview.length, reachedInterview.length),
      appliedToOffer: conversion(reachedOffer.length, cohort.length),
    },
    monthly: [...byMonth.values()],
    dataQuality: {
      inferredApplicationDates: cohort.filter(t => t.appliedInferred).length,
      offersWithoutRecordedInterview: reachedOffer.filter(t => !t.interviewAt).length,
      historiesOutOfOrder: cohort.filter(t => t.outOfOrder).length,
      repeatedTransitionsIgnored: cohort.reduce((sum, t) => sum + t.repeatedTransitions, 0),
      milestonesDatedBeforeApplication: cohort.filter(t => t.milestoneBeforeApplication).length,
    },
    minimumSample: OUTCOME_MIN_SAMPLE,
    caveats,
  };
}

class ApplicationOutcomeService {
  /** Outcomes for one user only: the query is always scoped to that user's records. */
  async forUser(userId: string, query: OutcomeQuery = {}, now = new Date()): Promise<ApplicationOutcomes> {
    const docs = await SavedOpportunity.find({ userId }).select('status statusHistory appliedAt isSample').lean<TrackedApplication[]>();
    return computeOutcomes(docs, query, now);
  }
}

export default new ApplicationOutcomeService();
