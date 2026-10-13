import apiClient from '../../lib/axios';

/** Mirrors backend/src/services/exams (E2, E3, E4). */
export interface ExamSource {
  title: string;
  url: string;
  published: string;
  accessedOn: string;
}

export interface ExamTopic {
  id: string;
  name: string;
  officialText: string;
  estimatedHours: number;
  prerequisites: string[];
  questionCount: number;
  limitedContent: boolean;
}

export interface ExamSummary {
  id: string;
  name: string;
  shortName: string;
  conductingBody: string;
  syllabusVersion: string;
  kind: 'competitive' | 'government_aptitude';
  sources: ExamSource[];
  officialPattern: string[];
  practiceRules: string[];
  secondsPerQuestion: number;
  sectionalTiming: boolean;
  disclaimer: string;
  questionCount: number;
  sections: Array<{ id: string; name: string; questionCount: number; topics: ExamTopic[] }>;
}

export type AnswerResponse = number | number[] | null;

export interface AttemptQuestion {
  questionId: string;
  sectionId: string;
  topicId: string;
  topicName: string;
  type: 'mcq' | 'msq' | 'nat';
  marks: number;
  negativeMarks: number;
  difficulty: string;
  stem: string;
  code: string | null;
  options: string[] | null;
  response: AnswerResponse;
  outcome?: 'correct' | 'wrong' | 'unanswered';
  marksAwarded?: number;
  correctAnswer?: string;
  explanation?: string;
}

export interface AttemptScore {
  attempted: number;
  correct: number;
  wrong: number;
  unanswered: number;
  marks: number;
  maxMarks: number;
  accuracy: number | null;
}

export interface AttemptSummary {
  id: string;
  examId: string;
  mode: 'practice' | 'timed';
  status: 'active' | 'completed';
  questionCount: number;
  answered: number;
  score: AttemptScore | null;
  timedOut: boolean;
  startedAt: string;
  completedAt: string | null;
}

export interface AttemptView extends AttemptSummary {
  syllabusVersion: string;
  timeLimitSec: number | null;
  deadline: string | null;
  serverTime: string;
  sections: Array<{ sectionId: string; name: string; timeLimitSec: number | null; startedAt: string | null; deadline: string | null; closedAt: string | null }>;
  questions: AttemptQuestion[];
}

export type TopicStatus = 'strength' | 'developing' | 'weakness' | 'insufficient' | 'not_practised';

export interface Performance {
  examId: string;
  completedAttempts: number;
  topics: Array<{
    topicId: string;
    topicName: string;
    sectionName: string;
    attempted: number;
    correct: number;
    wrong: number;
    unanswered: number;
    marks: number;
    accuracy: number | null;
    status: TopicStatus;
    lastPractisedAt: string | null;
  }>;
  recommendations: Array<{ topicId: string; topicName: string; action: string; reason: string }>;
  thresholds: { minAnswered: number; strengthAccuracy: number; weaknessAccuracy: number };
  caveats: string[];
}

export interface StudyPlan {
  examId: string;
  hoursPerWeek: number;
  startDate: string;
  generatedAt: string;
  regenerations: number;
  totals: { weeks: number; pendingHours: number; doneHours: number; estimatedEndDate: string | null };
  items: Array<{
    id: string;
    topicId: string;
    topicName: string;
    kind: 'learn' | 'practise' | 'revise';
    hours: number;
    week: number;
    weekStarts: string;
    reason: string;
    status: 'pending' | 'done';
    completedAt: string | null;
  }>;
  caveats: string[];
}

const data = <T,>(p: Promise<{ data: { data: T } }>) => p.then(r => r.data.data);

export const fetchExams = () => data<{ exams: ExamSummary[] }>(apiClient.get('/exams')).then(d => d.exams);
export const fetchExam = (examId: string) => data<ExamSummary>(apiClient.get(`/exams/${encodeURIComponent(examId)}`));
export const startAttempt = (examId: string, body: { sectionIds?: string[]; count: number; mode: 'practice' | 'timed' }) =>
  data<AttemptView>(apiClient.post(`/exams/${encodeURIComponent(examId)}/attempts`, body));
export const fetchAttempts = (examId: string) => data<{ attempts: AttemptSummary[] }>(apiClient.get(`/exams/${encodeURIComponent(examId)}/attempts`)).then(d => d.attempts);
export const fetchAttempt = (id: string) => data<AttemptView>(apiClient.get(`/exams/attempts/${encodeURIComponent(id)}`));
export const saveAnswer = (id: string, questionId: string, response: AnswerResponse) =>
  data<AttemptView>(apiClient.put(`/exams/attempts/${encodeURIComponent(id)}/answers`, { questionId, response }));
export const startSection = (id: string, sectionId: string) =>
  data<AttemptView>(apiClient.post(`/exams/attempts/${encodeURIComponent(id)}/sections/${encodeURIComponent(sectionId)}/start`));
export const submitAttempt = (id: string) => data<AttemptView>(apiClient.post(`/exams/attempts/${encodeURIComponent(id)}/submit`));
export const fetchPerformance = (examId: string) => data<Performance>(apiClient.get(`/exams/${encodeURIComponent(examId)}/performance`));
export const fetchPlan = (examId: string) => data<{ plan: StudyPlan | null }>(apiClient.get(`/exams/${encodeURIComponent(examId)}/plan`)).then(d => d.plan);
export const generatePlan = (examId: string, body: { hoursPerWeek: number; startDate?: string }) =>
  data<{ plan: StudyPlan }>(apiClient.put(`/exams/${encodeURIComponent(examId)}/plan`, body)).then(d => d.plan);
export const setPlanItem = (examId: string, itemId: string, status: 'pending' | 'done') =>
  data<{ plan: StudyPlan }>(apiClient.patch(`/exams/${encodeURIComponent(examId)}/plan/items/${encodeURIComponent(itemId)}`, { status })).then(d => d.plan);

export const STATUS_LABEL: Record<TopicStatus, string> = {
  strength: 'Strength',
  developing: 'Developing',
  weakness: 'Weak',
  insufficient: 'Too few answers',
  not_practised: 'Not practised',
};
