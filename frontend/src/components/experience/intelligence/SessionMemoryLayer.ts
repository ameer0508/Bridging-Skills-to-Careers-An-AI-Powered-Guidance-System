import StorageService from '../../../utils/storageService';

export interface SessionMemoryData {
  lastVisitTimestamp: number;
  completedTasksCount: number;
  previousReadinessScore: number;
  lastCareerTarget?: string;
  visitCount: number;
}

const STORAGE_KEY = 'sb_session_memory';

export const SessionMemoryLayer = {
  getMemory(): SessionMemoryData {
    return StorageService.getItem<SessionMemoryData>(STORAGE_KEY, {
      lastVisitTimestamp: Date.now(),
      completedTasksCount: 0,
      previousReadinessScore: 0,
      visitCount: 1,
    });
  },

  updateMemory(currentReadiness: number, completedCount: number, careerTarget?: string): SessionMemoryData {
    const prev = this.getMemory();
    const updated: SessionMemoryData = {
      lastVisitTimestamp: Date.now(),
      completedTasksCount: Math.max(prev.completedTasksCount, completedCount),
      previousReadinessScore: prev.previousReadinessScore === 0 ? currentReadiness : currentReadiness,
      lastCareerTarget: careerTarget || prev.lastCareerTarget,
      visitCount: prev.visitCount + 1,
    };

    StorageService.setItem(STORAGE_KEY, updated);
    return updated;
  },

  getReturningContextMessage(userName?: string, currentReadiness?: number): string {
    const memory = this.getMemory();
    const hoursSinceLast = Math.round((Date.now() - memory.lastVisitTimestamp) / (1000 * 60 * 60));

    if (memory.visitCount <= 1) {
      return `Welcome to SkillBridge, ${userName || 'User'}. Your AI Career Architect is analyzing your profile to generate custom milestones.`;
    }

    if (currentReadiness && memory.previousReadinessScore && currentReadiness > memory.previousReadinessScore) {
      const diff = currentReadiness - memory.previousReadinessScore;
      return `Welcome back, ${userName || 'User'}. Your readiness score improved by +${diff}% since your last session.`;
    }

    if (hoursSinceLast < 12) {
      return `Welcome back, ${userName || 'User'}. Continuing your active learning journey where you left off.`;
    }

    return `Good to see you again, ${userName || 'User'}. Your workspace is updated with the latest AI recommendations.`;
  },
};
