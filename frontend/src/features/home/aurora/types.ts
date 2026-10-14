import type { StudyPlanSchedule } from '../../roadmaps/components/StudyPlan';

/** Shape of GET /users/me/career-snapshot (backend/src/services/SnapshotService.ts). */
export interface UnifiedCareerSnapshot {
  targetCareer: string;
  targetRole?: string;
  primaryCareerDomain?: string;
  matchScore: number | null;
  isMatchEvaluated: boolean;
  readinessScore: number | null;
  isReadinessEvaluated: boolean;
  careerHealth: number | null;
  isCareerHealthEvaluated: boolean;
  totalSkills: number;
  criticalGaps: string[];
  roadmapProgress: number;
  isRoadmapInitialized: boolean;
  activePhaseTitle?: string | null;
  roadmap?: {
    isInitialized: boolean;
    progress: number;
    title: string | null;
    currentPhaseTitle: string | null;
    totalMilestones: number;
    completedMilestones: number;
    schedule?: StudyPlanSchedule | null;
    phases: Array<{ title: string; description?: string; items?: Array<{ title: string; status: string }> }>;
  };
  activeRecommendationsCount: number;
  topRecommendations?: Array<{ id?: string; title: string; reason?: string; category?: string; priority?: string }>;
  nextBestAction?: { action: string; route: string };
  opportunities: { saved: number; applied: number; interviewing: number; offer: number; rejected?: number; withdrawn?: number; total: number };
  interviews: { total: number; completed: number; averageScore: number | null; latestScore: number | null; isEvaluated: boolean; latestWeaknesses?: string[] };
  resumeInfo?: {
    hasResume: boolean;
    fileName?: string | null;
    detectedSkillsCount?: number;
    experienceCount?: number;
    projectsCount?: number;
    educationCount?: number;
    certificationsCount?: number;
    parsingStatus?: string;
    updatedAt?: string | null;
  };
  telemetry?: { timestamp: string; databaseStatus: string; primaryProvider: string; aiStatus?: 'LIVE' | 'FALLBACK'; marketStatus?: 'LIVE' | 'SANDBOX' };
}

export interface SkillsSummary {
  categories?: Record<string, Array<{ name: string; category?: string }>>;
  totalSkills: number;
}

export interface ActivityOverview {
  streak: { current: number; activeToday: boolean; lastActiveOn: string | null };
  recent?: Array<{ at: string; type: string; label: string }>;
}
