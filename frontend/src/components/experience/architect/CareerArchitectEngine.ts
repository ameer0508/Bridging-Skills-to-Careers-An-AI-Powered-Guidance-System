import { StrategyGenerator, StrategySummary } from './StrategyGenerator';
import { CareerPathComparisonEngine, PathComparisonItem } from './CareerPathComparisonEngine';
import { TradeoffAnalyzerEngine, TradeoffAnalysisResult } from './TradeoffAnalyzerEngine';
import { ScenarioSimulatorEngine, ScenarioResult } from './ScenarioSimulatorEngine';
import { CareerMatchItem, ReadinessItem, RecommendationItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';
import { WorkspaceInsightsHub, WorkspaceInsightsData } from '../momentum/WorkspaceInsightsHub';

export interface ComprehensiveArchitectStrategy {
  insights: WorkspaceInsightsData;
  strategySummary: StrategySummary;
  comparedPaths: PathComparisonItem[];
  tradeoffAnalysis: TradeoffAnalysisResult | null;
}

export const CareerArchitectEngine = {
  orchestrateStrategy(
    userName: string,
    matches: CareerMatchItem[],
    readiness: ReadinessItem[],
    totalSkills: number,
    recommendations: RecommendationItem[],
    roadmap: RoadmapData | null,
    visitCount = 1
  ): ComprehensiveArchitectStrategy {
    try {
      const insights = WorkspaceInsightsHub.getWorkspaceInsights(
        userName,
        matches,
        readiness,
        totalSkills,
        recommendations,
        roadmap,
        visitCount
      );

      const strategySummary = StrategyGenerator.generateStrategy(
        matches,
        readiness,
        totalSkills,
        recommendations,
        roadmap
      );

      const comparedPaths = CareerPathComparisonEngine.comparePaths(matches);

      let tradeoffAnalysis: TradeoffAnalysisResult | null = null;
      if (matches && matches.length >= 2) {
        tradeoffAnalysis = TradeoffAnalyzerEngine.analyzeTradeoffs(matches[0], matches[1]);
      }

      return {
        insights,
        strategySummary,
        comparedPaths,
        tradeoffAnalysis,
      };
    } catch (err) {
      console.error('CareerArchitectEngine: Error orchestrating strategy', err);
      return {
        insights: WorkspaceInsightsHub.getWorkspaceInsights(
          userName,
          [],
          [],
          totalSkills || 0,
          [],
          null,
          visitCount
        ),
        strategySummary: StrategyGenerator.generateStrategy([], [], totalSkills || 0, [], null),
        comparedPaths: [],
        tradeoffAnalysis: null,
      };
    }
  },

  simulateScenario(
    type: 'complete_skill' | 'switch_role' | 'increase_effort',
    targetTitle: string,
    currentScore: number
  ): ScenarioResult {
    try {
      return ScenarioSimulatorEngine.simulateScenario(type, targetTitle, currentScore);
    } catch (err) {
      console.error('CareerArchitectEngine: Error simulating scenario', err);
      return {
        simulatedScore: currentScore,
        scoreDelta: 0,
        unlockedOpportunitiesCount: 0,
        projectedTimeline: 'Adaptive',
        strategicInsight: 'Scenario simulation temporarily initializing.',
      };
    }
  },
};
