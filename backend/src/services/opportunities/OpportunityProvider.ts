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
  skills: string[];
  fetchedAt: string;
}

export interface EnrichedOpportunity extends CanonicalOpportunity {
  skillbridgeMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
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
