import apiClient from '../../lib/axios';

/** Types and calls for the Career Lab. Shapes mirror backend/src/services/CareerScenarioService.ts. */

export interface CareerOption {
  id: string;
  title: string;
  category: string;
  description?: string;
}

export interface CoverageCount {
  total: number;
  covered: number;
}

export interface ComparedCareer {
  careerId: string;
  careerTitle: string;
  category: string;
  matchScore: number;
  requirements: { total: number; required: CoverageCount; preferred: CoverageCount; supporting: CoverageCount };
  evidence: { applied: number; listedOnly: number; inferred: number; averageEvidenceScore: number | null };
  effort: {
    skillsToAcquire: string[];
    requiredSkillsToAcquire: string[];
    skillsToStrengthen: string[];
    pointsToClose: number;
    pointsPossible: number;
  };
  sharedWithOthers: string[];
  market: CareerMarketEvidence;
}

export interface CareerMarketEvidence {
  state: 'sourced_valid' | 'no_source' | 'sparse' | 'stale' | 'synthetic' | 'error';
  usable: boolean;
  label: string;
  detail: string;
  evidence: null | {
    distinctPostings: number;
    monthsWithPostings: number;
    location: string;
    period: { from: string; to: string };
    sources: Array<{ name: string; licence: string; postings: number }>;
    latestRetrievedAt: string | null;
    ageDays: number | null;
    matchingRule: string;
  };
}

export interface CompareResult {
  hasProfile: boolean;
  careers: ComparedCareer[];
  effortNote: string;
  marketData: { available: boolean; careersWithEvidence: number; reason: string; note: string };
}

export type ScenarioChangeType = 'add_skill' | 'add_project' | 'add_certification' | 'add_experience' | 'remove_skill';

export type ScenarioChange =
  | { type: 'add_skill' | 'remove_skill'; skill: string }
  | { type: 'add_project' | 'add_certification' | 'add_experience'; skills: string[] };

export interface RequirementDelta {
  skillName: string;
  importance: string;
  pointsPossible: number;
  statusBefore: string;
  statusAfter: string;
  pointsBefore: number;
  pointsAfter: number;
  pointsDelta: number;
}

export interface CareerScenarioResult {
  careerId: string;
  careerTitle: string;
  scoreBefore: number;
  scoreAfter: number;
  scoreDelta: number;
  missingRequiredBefore: number;
  missingRequiredAfter: number;
  requirementChanges: RequirementDelta[];
}

export interface WhatIfResult {
  hasProfile: boolean;
  hypotheticalSkills: Array<{ name: string; evidenceScore: number }>;
  careers: CareerScenarioResult[];
  note: string;
}

export interface CounterfactualResult {
  careerId: string;
  careerTitle: string;
  hasProfile: boolean;
  baseline: { score: number; missingRequired: number };
  singleChanges: Array<{
    skillName: string;
    importance: string;
    currentStatus: string;
    action: string;
    scoreAfter: number;
    scoreDelta: number;
    closesRequiredGap: boolean;
  }>;
  pathToTarget: {
    targetScore: number;
    reached: boolean;
    finalScore: number;
    steps: Array<{ step: number; skillName: string; action: string; scoreAfter: number; scoreDelta: number }>;
  };
  assumption: string;
  note: string;
}

export type FreshnessStatus = 'current' | 'aging' | 'stale' | 'undated';

export interface SkillFreshness {
  userSkillId: string;
  name: string;
  category: string;
  evidenceScore: number;
  status: FreshnessStatus;
  lastEvidencedAt: string | null;
  monthsSinceLastUse: number | null;
  basis: string | null;
  verification: 'stated' | 'self_attested' | 'assessed' | null;
  revalidationSuggested: boolean;
}

export interface FreshnessResult {
  skills: SkillFreshness[];
  summary: Record<FreshnessStatus | 'total', number>;
  policy: { currentWithinMonths: number; agingWithinMonths: number };
  note: string;
}

export interface TransitionStage {
  order: number;
  careerId: string;
  careerTitle: string;
  skillsToAcquire: string[];
  skillsStillMissing: string[];
  scoreAtCreation: number;
  currentScore: number | null;
  projectedScore: number;
  reached: boolean;
}

export interface TransitionPlan {
  id: string;
  targetCareerId: string;
  targetCareerTitle: string;
  stages: TransitionStage[];
  createdAt: string;
  updatedAt: string;
  outdated: boolean;
}

export interface IntelligenceFigures {
  skillCount: number;
  topCareerTitle: string | null;
  topMatchScore: number | null;
  readinessScore: number | null;
  activeRecommendations: number;
}

export interface RecalculationRun {
  id: string;
  at: string;
  trigger: string;
  status: 'completed' | 'skipped_duplicate' | 'failed';
  modulesRecomputed: string[];
  modulesSkipped: string[];
  before: IntelligenceFigures;
  after: IntelligenceFigures;
  scoringVersion: string;
  taxonomyVersion: string;
  durationMs: number;
}

export interface AssessableSkill {
  skill: string;
  questionsInBank: number;
  questionCount: number;
  passMark: number;
  onProfile: boolean;
  evidenceScore: number | null;
  verified: boolean;
  verifiedAt: string | null;
  inProgressAttemptId: string | null;
  attemptsRemaining: number;
  nextAttemptAt: string | null;
  lastResult: { correct: number; of: number; passed: boolean; at: string | null } | null;
}

export interface AssessmentHistoryItem {
  attemptId: string;
  skill: string;
  status: 'in_progress' | 'submitted' | 'expired';
  startedAt: string;
  submittedAt: string | null;
  correct: number | null;
  of: number;
  passed: boolean | null;
}

export interface AssessmentOverview {
  skills: AssessableSkill[];
  history: AssessmentHistoryItem[];
  policy: { questionCount: number; passMark: number; minutesToComplete: number; attemptsPerDay: number; points: number };
  bankVersion: string;
  note: string;
}

export interface AssessmentAttempt {
  attemptId: string;
  skill: string;
  startedAt: string;
  expiresAt: string;
  passMark: number;
  questions: Array<{ prompt: string; options: string[] }>;
  resumed: boolean;
}

export interface AssessmentResult {
  attemptId: string;
  skill: string;
  correct: number;
  of: number;
  passMark: number;
  passed: boolean;
  review: Array<{ prompt: string; options: string[]; chosen: number | null; correctOption: number; correct: boolean; explanation: string }>;
  evidence: { added: boolean; evidenceScoreBefore: number | null; evidenceScoreAfter: number; userSkillId: string } | null;
  recalculation: { status: string; modulesRecomputed: string[] } | null;
  note: string;
}

export const careerLabApi = {
  catalog: async (): Promise<CareerOption[]> => (await apiClient.get('/careers/catalog')).data.data.careers,
  compare: async (careerIds: string[]): Promise<CompareResult> => (await apiClient.post('/careers/compare', { careerIds })).data.data,
  whatIf: async (changes: ScenarioChange[], careerIds?: string[]): Promise<WhatIfResult> =>
    (await apiClient.post('/careers/what-if', { changes, careerIds })).data.data,
  counterfactuals: async (careerId: string, targetScore?: number): Promise<CounterfactualResult> =>
    (await apiClient.get(`/careers/${careerId}/counterfactuals`, { params: { targetScore } })).data.data,
  freshness: async (): Promise<FreshnessResult> => (await apiClient.get('/skills/freshness')).data.data,
  revalidate: async (userSkillId: string, note?: string): Promise<SkillFreshness> =>
    (await apiClient.post(`/skills/${userSkillId}/revalidate`, { note: note || undefined })).data.data.skill,
  assessments: async (): Promise<AssessmentOverview> => (await apiClient.get('/skills/assessments')).data.data,
  startAssessment: async (skill: string): Promise<AssessmentAttempt> => (await apiClient.post('/skills/assessments', { skill })).data.data.attempt,
  submitAssessment: async (attemptId: string, answers: Array<number | null>): Promise<AssessmentResult> =>
    (await apiClient.post(`/skills/assessments/${attemptId}/submit`, { answers })).data.data,
  plans: async (): Promise<TransitionPlan[]> => (await apiClient.get('/careers/transition-plans')).data.data.plans,
  createPlan: async (targetCareerId: string): Promise<TransitionPlan> =>
    (await apiClient.post('/careers/transition-plans', { targetCareerId })).data.data.plan,
  deletePlan: async (planId: string): Promise<void> => {
    await apiClient.delete(`/careers/transition-plans/${planId}`);
  },
  history: async (): Promise<RecalculationRun[]> => (await apiClient.get('/users/me/intelligence-history')).data.data.runs,
};

export const STATUS_LABEL: Record<string, string> = {
  applied: 'Used in a role or project',
  listed: 'Listed only',
  inferred: 'Inferred from a related skill',
  missing: 'Not on your resume',
};

export const TRIGGER_LABEL: Record<string, string> = {
  resume_processed: 'Resume processed',
  resume_deleted: 'Resume deleted',
  skill_evidence_changed: 'Skill evidence changed',
  target_role_changed: 'Profile or target role changed',
  roadmap_progress: 'Roadmap progress',
  interview_completed: 'Interview completed',
  taxonomy_changed: 'Career data updated',
  manual: 'Manual refresh',
};
