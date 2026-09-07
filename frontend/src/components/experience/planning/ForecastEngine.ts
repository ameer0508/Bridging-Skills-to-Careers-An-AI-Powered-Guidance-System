import { CareerMatchItem, ReadinessItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface OpportunityForecastData {
  projectedReadinessScore: number;
  readinessDelta: number;
  unlockedRoleCount: number;
  upcomingMilestonesCount: number;
  trajectoryLabel: 'Accelerating' | 'Steady Growth' | 'Initiating';
}

export const ForecastEngine = {
  calculateForecast(
    topMatch: CareerMatchItem | null,
    topReadiness: ReadinessItem | null,
    roadmap: RoadmapData | null
  ): OpportunityForecastData {
    const currentScore = topReadiness?.overallScore || 0;
    const currentProgress = roadmap?.progressPercentage || 0;

    // Deterministic projection: completing current phase adds +12% readiness boost
    const projectedReadinessScore = Math.min(100, Math.round(currentScore + (100 - currentProgress) * 0.15));
    const readinessDelta = Math.max(0, projectedReadinessScore - currentScore);

    const unlockedRoleCount = currentScore >= 70 ? 5 : currentScore >= 40 ? 3 : 1;
    const upcomingMilestonesCount = roadmap?.phases?.flatMap((p) => p.items || []).filter((i) => i.status !== 'completed').length || 0;

    let trajectoryLabel: 'Accelerating' | 'Steady Growth' | 'Initiating' = 'Initiating';
    if (currentProgress > 40 || currentScore > 60) trajectoryLabel = 'Accelerating';
    else if (currentProgress > 0 || currentScore > 0) trajectoryLabel = 'Steady Growth';

    return {
      projectedReadinessScore,
      readinessDelta,
      unlockedRoleCount,
      upcomingMilestonesCount,
      trajectoryLabel,
    };
  },
};
