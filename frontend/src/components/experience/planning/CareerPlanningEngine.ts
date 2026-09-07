import { AIWorkspaceEngine, AINormalizedContext } from '../intelligence/AIWorkspaceEngine';
import { MissionEngine, Mission } from './MissionEngine';
import { ForecastEngine, OpportunityForecastData } from './ForecastEngine';
import { ProgressNarrativeEngine } from './ProgressNarrativeEngine';
import { AchievementEngine, Achievement } from './AchievementEngine';
import { CareerMatchItem, ReadinessItem, RecommendationItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface SimulatedDecisionImpact {
  itemTitle: string;
  readinessBoost: number;
  projectedReadinessScore: number;
  unlockedRoleTitle: string;
  unlocksNextPhase: boolean;
  unlockedSkillGaps: string[];
}

export interface ComprehensivePlan {
  aiContext: AINormalizedContext;
  missions: Mission[];
  forecast: OpportunityForecastData;
  progressNarrative: string;
  achievements: Achievement[];
}

export const CareerPlanningEngine = {
  createPlan(
    userName: string,
    matches: CareerMatchItem[],
    readiness: ReadinessItem[],
    totalSkills: number,
    recommendations: RecommendationItem[],
    roadmap: RoadmapData | null
  ): ComprehensivePlan {
    const aiContext = AIWorkspaceEngine.normalizeContext(matches, readiness, totalSkills, recommendations, roadmap);
    const missions = MissionEngine.generateMissions(roadmap, recommendations);
    const forecast = ForecastEngine.calculateForecast(aiContext.topMatch, aiContext.topReadiness, roadmap);
    const progressNarrative = ProgressNarrativeEngine.generateNarrative(
      userName,
      aiContext.topMatch,
      aiContext.topReadiness,
      totalSkills,
      roadmap
    );
    const achievements = AchievementEngine.evaluateAchievements(
      totalSkills,
      aiContext.topReadiness?.overallScore || 0,
      roadmap,
      aiContext.topMatch?.careerId?.title
    );

    return {
      aiContext,
      missions,
      forecast,
      progressNarrative,
      achievements,
    };
  },

  simulateDecision(
    itemTitle: string,
    currentScore: number,
    targetRoleTitle?: string
  ): SimulatedDecisionImpact {
    const charSum = itemTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const readinessBoost = 4 + (charSum % 3); // 4-6% deterministic boost based on item title
    const projectedReadinessScore = Math.min(100, currentScore + readinessBoost);
    const unlockedRoleTitle = targetRoleTitle || 'Target Career Role';
    const unlocksNextPhase = projectedReadinessScore >= 40;

    return {
      itemTitle,
      readinessBoost,
      projectedReadinessScore,
      unlockedRoleTitle,
      unlocksNextPhase,
      unlockedSkillGaps: ['API Architecture', 'Production Deployment'],
    };
  },
};
