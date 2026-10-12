import apiClient from '../../lib/axios';

/** Mirrors backend/src/services/careers/CareerDomainPreviewService.ts (E1). */
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
  requirements: Array<{ skill: string; importance: 'required' | 'preferred' | 'supporting'; weight: number; basis: RequirementBasis; lexicon: 'present' | 'proposed' }>;
  similar: Array<{ title: string; score: number }>;
}

export interface Catalogue {
  status: 'preview';
  statusText: string;
  careers: CatalogueCareer[];
  proposedLexiconSkills: string[];
  source: { attribution: string; licenseUrl: string; databaseUrl: string; accessedOn: string };
}

export interface Preview {
  status: 'preview';
  hasProfile: boolean;
  careers: Array<{ title: string; domain: string; score: number; matchingSkills: string[]; missingSkills: string[]; notYetRecognisable: string[] }>;
  caveats: string[];
}

export const fetchCatalogue = async () => (await apiClient.get('/career-domains')).data.data as Catalogue;
export const fetchPreview = async () => (await apiClient.get('/career-domains/preview')).data.data as Preview;
