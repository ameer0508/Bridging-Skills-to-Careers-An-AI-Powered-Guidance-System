import apiClient from '../../lib/axios';

/** Mirrors backend/src/services/interview/TechnicalAssessmentService.ts (D4). */
export type TaskKind = 'trace' | 'review' | 'complexity' | 'sql';

export interface AssessmentTaskView {
  taskId: string;
  kind: TaskKind;
  skill: string;
  language: 'javascript' | 'python' | 'sql';
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  code: string;
  tables?: string;
  answerType: 'choice' | 'text' | 'line';
  options?: string[];
  lineCount?: number;
  answered: boolean;
  response?: string | number;
  correct?: boolean;
  correctAnswer?: string;
  explanation?: string;
}

export interface AssessmentView {
  id: string;
  status: 'active' | 'completed';
  filters: { skills: string[]; kinds: string[] };
  tasks: AssessmentTaskView[];
  progress: { answered: number; total: number };
  score: { answered: number; correct: number; total: number; percent: number } | null;
  bySkill: Array<{ skill: string; correct: number; total: number }>;
  startedAt: string;
  completedAt: string | null;
  method: string;
}

export interface AssessmentCatalog {
  skills: Record<string, number>;
  kinds: Record<TaskKind, number>;
  total: number;
  maxTasks: number;
}

export const KIND_LABEL: Record<TaskKind, string> = {
  trace: 'Trace the output',
  review: 'Find the defect',
  complexity: 'Complexity',
  sql: 'Read the query',
};

export const fetchCatalog = async () => (await apiClient.get('/interviews/assessments/catalog')).data.data as AssessmentCatalog;
export const fetchAssessments = async () => (await apiClient.get('/interviews/assessments')).data.data.assessments as AssessmentView[];
export const startAssessment = async (body: { skills?: string[]; kinds?: TaskKind[]; count: number }) =>
  (await apiClient.post('/interviews/assessments', body)).data.data as AssessmentView;
export const answerTask = async (id: string, taskId: string, response: string | number) =>
  (await apiClient.post(`/interviews/assessments/${encodeURIComponent(id)}/answers`, { taskId, response })).data.data as AssessmentView;
export const finishAssessment = async (id: string) =>
  (await apiClient.post(`/interviews/assessments/${encodeURIComponent(id)}/finish`)).data.data as AssessmentView;
