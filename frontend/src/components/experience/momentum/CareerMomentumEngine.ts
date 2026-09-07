import { MomentumScoreEngine, MomentumScoreData } from './MomentumScoreEngine';
import { VelocityEngine, VelocityMetrics } from './VelocityEngine';
import { TrendAnalysisEngine, TrendAnalysisResult } from './TrendAnalysisEngine';
import { PlateauDetectionEngine, PlateauAnalysis } from './PlateauDetectionEngine';
import { GrowthStoryEngine, GrowthStoryData } from './GrowthStoryEngine';
import { CareerHealthEngine, CareerHealthData } from './CareerHealthEngine';
import { CareerMatchItem, ReadinessItem, RecommendationItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface ComprehensiveMomentumTelemetry {
  momentumScore: MomentumScoreData;
  velocity: VelocityMetrics;
  trend: TrendAnalysisResult;
  plateau: PlateauAnalysis;
  growthStory: GrowthStoryData;
  careerHealth: CareerHealthData;
}

export const CareerMomentumEngine = {
  computeMomentumTelemetry(
    userName: string,
    matches: CareerMatchItem[],
    readiness: ReadinessItem[],
    totalSkills: number,
    recommendations: RecommendationItem[],
    roadmap: RoadmapData | null,
    visitCount = 1
  ): ComprehensiveMomentumTelemetry {
    const topMatch = matches[0] || null;
    const topReadiness = readiness[0] || null;

    const momentumScore = MomentumScoreEngine.calculateMomentum(
      topMatch,
      topReadiness,
      totalSkills,
      recommendations,
      roadmap,
      visitCount
    );

    const velocity = VelocityEngine.calculateVelocity(
      roadmap,
      totalSkills,
      topReadiness?.overallScore || 0
    );

    const trend = TrendAnalysisEngine.analyzeTrend(
      momentumScore.overallScore,
      roadmap?.progressPercentage || 0,
      totalSkills
    );

    const plateau = PlateauDetectionEngine.detectPlateau(
      roadmap?.progressPercentage || 0,
      totalSkills,
      recommendations.filter((r) => r.status === 'completed').length
    );

    const growthStory = GrowthStoryEngine.generateGrowthStory(
      userName,
      topMatch,
      topReadiness,
      totalSkills,
      roadmap
    );

    const careerHealth = CareerHealthEngine.evaluateHealth(
      totalSkills,
      topReadiness,
      recommendations,
      roadmap
    );

    return {
      momentumScore,
      velocity,
      trend,
      plateau,
      growthStory,
      careerHealth,
    };
  },
};
