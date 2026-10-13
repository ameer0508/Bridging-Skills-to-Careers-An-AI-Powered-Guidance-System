import apiClient from '../../lib/axios';

/** Mirrors backend/src/services/careers/CareerDomainService.ts (E1). */
export type RequirementBasis =
  | { type: 'onet_software'; examples: string[]; hotTechnology: boolean; inDemand: boolean }
  | { type: 'onet_knowledge'; element: string; importance: number }
  | { type: 'editorial'; note: string };

export interface CatalogueCareer {
  title: string;
  category: string;
  domain: string;
  newDomain: boolean;
  description: string;
  onet: { code: string; title: string; note?: string };
  requirements: Array<{ skill: string; importance: 'required' | 'preferred' | 'supporting'; weight: number; basis: RequirementBasis }>;
  similar: Array<{ title: string; score: number }>;
}

export interface Catalogue {
  status: 'integrated';
  statusText: string;
  scopeNote: string;
  careers: CatalogueCareer[];
  addedSkills: string[];
  source: { attribution: string; licenseUrl: string; databaseUrl: string; accessedOn: string };
}

export interface DomainMatches {
  careers: Array<{ careerId: string; title: string; domain: string; matchScore: number | null; matchingSkills: string[]; missingSkills: string[] }>;
  notes: string[];
}

export const fetchCatalogue = async () => (await apiClient.get('/career-domains')).data.data as Catalogue;
export const fetchDomainMatches = async () => (await apiClient.get('/career-domains/matches')).data.data as DomainMatches;
