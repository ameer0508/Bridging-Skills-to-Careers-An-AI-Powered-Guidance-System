import { WorkspaceInsightsHub, WorkspaceInsightsData } from '../momentum/WorkspaceInsightsHub';
import { ContextPrioritizationEngine, ContextPrioritizationResult } from './ContextPrioritizationEngine';
import { AdaptiveLayoutEngine, LayoutConfig } from './AdaptiveLayoutEngine';
import { CareerMatchItem, ReadinessItem, RecommendationItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface ComprehensiveAdaptiveWorkspaceState {
  insights: WorkspaceInsightsData;
  prioritization: ContextPrioritizationResult;
  layoutConfig: LayoutConfig;
}

export const AdaptiveWorkspaceEngine = {
  orchestrateAdaptiveState(
    userName: string,
    matches: CareerMatchItem[],
    readiness: ReadinessItem[],
    totalSkills: number,
    recommendations: RecommendationItem[],
    roadmap: RoadmapData | null,
    visitCount = 1
  ): ComprehensiveAdaptiveWorkspaceState {
    const insights = WorkspaceInsightsHub.getWorkspaceInsights(
      userName,
      matches,
      readiness,
      totalSkills,
      recommendations,
      roadmap,
      visitCount
    );

    const prioritization = ContextPrioritizationEngine.determineFocus(
      insights.planning,
      insights.momentum
    );

    const layoutConfig = AdaptiveLayoutEngine.computeLayoutConfig(prioritization.primaryFocus);

    return {
      insights,
      prioritization,
      layoutConfig,
    };
  },
};
