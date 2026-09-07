import { CareerPlanningEngine, ComprehensivePlan } from '../planning/CareerPlanningEngine';
import { CareerMomentumEngine, ComprehensiveMomentumTelemetry } from './CareerMomentumEngine';
import { CareerMatchItem, ReadinessItem, RecommendationItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface WorkspaceInsightsData {
  planning: ComprehensivePlan;
  momentum: ComprehensiveMomentumTelemetry;
  timestamp: number;
}

export const WorkspaceInsightsHub = {
  getWorkspaceInsights(
    userName: string,
    matches: CareerMatchItem[],
    readiness: ReadinessItem[],
    totalSkills: number,
    recommendations: RecommendationItem[],
    roadmap: RoadmapData | null,
    visitCount = 1
  ): WorkspaceInsightsData {
    const planning = CareerPlanningEngine.createPlan(
      userName,
      matches,
      readiness,
      totalSkills,
      recommendations,
      roadmap
    );

    const momentum = CareerMomentumEngine.computeMomentumTelemetry(
      userName,
      matches,
      readiness,
      totalSkills,
      recommendations,
      roadmap,
      visitCount
    );

    return {
      planning,
      momentum,
      timestamp: Date.now(),
    };
  },
};
