import type { ListingFreshness, ListingFreshnessStatus } from './freshness.js';

export interface OpportunitySearchQuery {
  keywords?: string;
  location?: string;
  remoteOnly?: boolean;
  employmentType?: string;
  datePosted?: string;
  /** Minimum yearly salary. Only postings that state a salary can satisfy it. */
  salaryMin?: number;
  sortBy?: 'match' | 'date' | 'salary' | 'relevance';
  page?: number;
  limit?: number;
}

export interface CanonicalOpportunity {
  externalId: string;
  provider: string;
  title: string;
  company: string;
  description: string;
  location: string;
  remote: boolean;
  employmentType: string;
  salary: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  } | null;
  /** ISO date the posting was published, or null when the provider did not say. */
  postedAt: string | null;
  applicationUrl: string;
  sourceUrl: string;
  /** Skills the provider explicitly lists as required (empty when it lists none). */
  skills: string[];
  /** Qualification bullet points, when the provider supplies them separately. */
  qualifications?: string[];
  /** True for built-in sample listings shown when no live provider key is configured. */
  isSample?: boolean;
  fetchedAt: string;
}

export interface EnrichedOpportunity extends CanonicalOpportunity {
  /** How old the listing is, from the source's own date; samples and undated listings say so. */
  freshness: ListingFreshness;
  /** 0-100, or null when no honest score can be calculated (see matchStatus). */
  skillbridgeMatchScore: number | null;
  matchStatus: 'SCORED' | 'NO_REQUIREMENTS' | 'NO_CANDIDATE_EVIDENCE';
  matchedSkills: string[];
  missingSkills: string[];
  requirements: Array<{
    skill: string;
    importance: 'required' | 'preferred';
    status: 'applied' | 'listed' | 'inferred' | 'missing';
    matchedVia?: string;
  }>;
  matchExplanation: string;
}

/** Describes one page of search results honestly: where it came from and what was filtered. */
export interface OpportunitySearchMeta {
  total: number;
  page: number;
  limit: number;
  /** True when the provider returned a full page, so a further page may exist. */
  hasMore: boolean;
  /** 'live' = real provider results, 'sample' = built-in demo listings, 'unavailable' = provider failed. */
  source: 'live' | 'sample' | 'unavailable';
  fetchedAt: string | null;
  fromCache: boolean;
  duplicatesRemoved: number;
  /** Whether any posting in this result set states a salary. */
  salaryDataAvailable: boolean;
  /** Present when a minimum salary was requested. */
  salaryFilter: { requestedMin: number; excludedWithoutSalary: number } | null;
  /** Postings dropped by a date filter because the provider gave no publication date. */
  excludedWithoutDate: number;
  /** Why nothing is shown, when source is 'unavailable'. */
  unavailableReason: 'provider_error' | 'quota_exhausted' | null;
  /** Seconds since these results were fetched from the provider (0 when just fetched). */
  resultAgeSeconds: number | null;
  /** True when results older than the cache window are served because today's provider quota is used up. */
  stale: boolean;
  /** How many of the shown listings are new, recent, old, undated or samples. */
  freshness: Record<ListingFreshnessStatus, number>;
  /** Outbound provider searches today. Present for a live provider only. */
  providerQuota: { limit: number; used: number; remaining: number; resetsAt: string } | null;
}

export interface OpportunityProviderHealth {
  // BLOCKED_BY_POLICY: a key is configured but the zero-cost policy does not allow live calls
  status: 'UP' | 'DOWN' | 'PENDING_CREDS' | 'BLOCKED_BY_POLICY';
  provider: string;
  message?: string;
}

export interface OpportunityProvider {
  name: string;
  search(query: OpportunitySearchQuery): Promise<CanonicalOpportunity[]>;
  getById(externalId: string): Promise<CanonicalOpportunity | null>;
  healthCheck(): Promise<OpportunityProviderHealth>;
}
