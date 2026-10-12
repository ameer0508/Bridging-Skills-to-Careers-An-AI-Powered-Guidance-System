import apiClient from '../../lib/axios';

/** Mirrors backend/src/services/applications/ApplicationOutcomeService.ts. */
export type RateStatus = 'no_observations' | 'insufficient_sample' | 'measured';

export interface ConversionRate {
  numerator: number;
  denominator: number;
  rate: number | null;
  status: RateStatus;
}

export interface ApplicationOutcomes {
  period: { from: string; to: string; observedUntil: string };
  scope: { includesDemoListings: boolean; applicationsInPeriod: number; savedNotApplied: number; demoListingApplicationsExcluded: number };
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

export interface OutcomeFilters {
  from?: string;
  to?: string;
  includeDemoListings: boolean;
}

export async function fetchApplicationOutcomes(filters: OutcomeFilters): Promise<ApplicationOutcomes> {
  const params: Record<string, string> = {};
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.includeDemoListings) params.includeDemoListings = 'true';
  const res = await apiClient.get('/applications/outcomes', { params });
  return res.data.data as ApplicationOutcomes;
}
