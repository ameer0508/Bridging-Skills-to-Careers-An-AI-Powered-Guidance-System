import apiClient from '../../lib/axios';

/** Mirrors backend/src/services/employer/EmployerPostingService.ts and controllers/EmployerController.ts. */
export type PostingStatus = 'draft' | 'open' | 'closed' | 'withdrawn' | 'hidden';
export interface Salary {
  min: number | null;
  max: number | null;
  currency: 'INR';
  period: 'YEAR' | 'MONTH';
}

export interface PublicPosting {
  id: string;
  organizationName: string;
  organization: { website: string | null; emailDomainMatchesWebsite: boolean; selfDeclared: true };
  title: string;
  description: string;
  city: string;
  state: string;
  workMode: string;
  employmentType: string;
  salary: Salary | null;
  skills: string[];
  applyUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  expiresAt: string | null;
  disclosure: string;
}

export interface OwnPosting extends PublicPosting {
  status: PostingStatus;
  unrecognisedSkills: string[];
  consent: { termsVersion: string; uses: string[]; grantedAt: string } | null;
  closedAt: string | null;
  withdrawnAt: string | null;
  hiddenReason: string | null;
  reports: number;
  inMarketData: boolean;
  reasons?: string[];
}

export interface Terms {
  terms: { version: string; summary: string; uses: Record<string, string>; withdrawal: string; verification: string };
  disclosure: string;
  limits: { openPostingsPerUser: number; newPostingsPerDay: number; openDays: number; reportsToHide: number; maxSkills: number };
  salaryBounds: Record<'YEAR' | 'MONTH', { min: number; max: number }>;
  options: { states: string[]; workModes: string[]; employmentTypes: string[]; reportReasons: string[] };
}

export interface Organization {
  organizationName: string;
  website: string | null;
  emailDomainMatchesWebsite: boolean;
  selfDeclared: true;
}

export interface PostingInput {
  title: string;
  description: string;
  city: string;
  state: string;
  workMode: string;
  employmentType: string;
  salary: Salary | null;
  skills: string[];
  applyUrl: string | null;
}

const data = <T>(res: { data: { data: T } }) => res.data.data;

export const fetchTerms = async () => data<Terms>(await apiClient.get('/employer/terms'));
export const fetchOrganization = async () => data<{ organization: Organization | null }>(await apiClient.get('/employer/organization')).organization;
export const saveOrganization = async (body: { organizationName: string; website: string | null }) =>
  data<{ organization: Organization }>(await apiClient.put('/employer/organization', body)).organization;
export const fetchOpenPostings = async (filters: { skill?: string; state?: string }) => {
  const params: Record<string, string> = {};
  if (filters.skill?.trim()) params.skill = filters.skill.trim();
  if (filters.state) params.state = filters.state;
  return data<{ postings: PublicPosting[]; disclosure: string }>(await apiClient.get('/employer/postings', { params }));
};
export const fetchMyPostings = async () => data<{ postings: OwnPosting[] }>(await apiClient.get('/employer/postings/mine')).postings;
export const createPosting = async (body: PostingInput) => data<{ posting: OwnPosting }>(await apiClient.post('/employer/postings', body)).posting;
export const publishPosting = async (id: string, termsVersion: string) =>
  data<{ posting: OwnPosting }>(await apiClient.post(`/employer/postings/${id}/publish`, { termsVersion, authorizedToPost: true, realOpening: true, grantsUses: true })).posting;
export const postingAction = async (id: string, action: 'close' | 'withdraw') => data<{ posting: OwnPosting }>(await apiClient.post(`/employer/postings/${id}/${action}`)).posting;
export const deleteDraft = async (id: string) => apiClient.delete(`/employer/postings/${id}`);
export const reportPosting = async (id: string, reason: string, note: string) =>
  data<{ reported: boolean; hidden: boolean }>(await apiClient.post(`/employer/postings/${id}/reports`, { reason, ...(note.trim() ? { note } : {}) }));
export const fetchReported = async () => data<{ postings: OwnPosting[] }>(await apiClient.get('/employer/admin/reports')).postings;
export const moderatePosting = async (id: string, action: 'hide' | 'restore') =>
  data<{ posting: OwnPosting }>(await apiClient.post(`/employer/admin/postings/${id}/${action}`)).posting;

export const LABEL: Record<string, string> = {
  onsite: 'On site',
  hybrid: 'Hybrid',
  remote: 'Remote',
  full_time: 'Full time',
  part_time: 'Part time',
  contract: 'Contract',
  internship: 'Internship',
  apprenticeship: 'Apprenticeship',
  not_a_real_job: 'Not a real job',
  misleading: 'Misleading',
  discriminatory: 'Discriminatory',
  scam_or_fee: 'Scam or asks for a fee',
  duplicate: 'Duplicate',
  other: 'Other',
  draft: 'Draft',
  open: 'Open',
  closed: 'Closed',
  withdrawn: 'Withdrawn',
  hidden: 'Hidden',
};

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
export function salaryText(s: Salary | null): string {
  if (!s) return 'Pay not stated';
  const per = s.period === 'YEAR' ? 'a year' : 'a month';
  if (s.min !== null && s.max !== null) return `${rupees(s.min)} – ${rupees(s.max)} ${per}`;
  if (s.min !== null) return `From ${rupees(s.min)} ${per}`;
  return `Up to ${rupees(s.max!)} ${per}`;
}
