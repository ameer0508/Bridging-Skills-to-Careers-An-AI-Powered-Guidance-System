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
    if (matches.length >= 2) {
      tradeoffAnalysis = TradeoffAnalyzerEngine.analyzeTradeoffs(matches[0], matches[1]);
    }

    return {
      insights,
      strategySummary,
      comparedPaths,
      tradeoffAnalysis,
    };
  },

  simulateScenario(
    type: 'complete_skill' | 'switch_role' | 'increase_effort',
    targetTitle: string,
    currentScore: number
  ): ScenarioResult {
    return ScenarioSimulatorEngine.simulateScenario(type, targetTitle, currentScore);
  },
};
