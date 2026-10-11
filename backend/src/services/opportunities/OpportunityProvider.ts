export interface OpportunitySearchQuery {
  keywords?: string;
  location?: string;
  remoteOnly?: boolean;
  employmentType?: string;
  datePosted?: string;
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
  postedAt: string;
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

export interface OpportunityProviderHealth {
  status: 'UP' | 'DOWN' | 'PENDING_CREDS';
  provider: string;
  message?: string;
}

export interface OpportunityProvider {
  name: string;
  search(query: OpportunitySearchQuery): Promise<CanonicalOpportunity[]>;
  getById(externalId: string): Promise<CanonicalOpportunity | null>;
  healthCheck(): Promise<OpportunityProviderHealth>;
}
