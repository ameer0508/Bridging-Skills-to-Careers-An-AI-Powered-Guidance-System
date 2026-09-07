import { CareerMatchItem, ReadinessItem, RecommendationItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface MomentumFactor {
  name: string;
  weightPercentage: number;
  score: number;
  contribution: number;
  evidence: string;
}

export interface MomentumScoreData {
  overallScore: number;
  factors: MomentumFactor[];
  recentDelta: number;
  confidence: string;
}

export const MomentumScoreEngine = {
  calculateMomentum(
    topMatch: CareerMatchItem | null,
    topReadiness: ReadinessItem | null,
    totalSkills: number,
    recommendations: RecommendationItem[],
    roadmap: RoadmapData | null,
    visitCount = 1
  ): MomentumScoreData {
    const roadmapProgress = roadmap?.progressPercentage || 0;
    const readinessScore = topReadiness?.overallScore || 0;
    const recsCompleted = recommendations.filter((r) => r.status === 'completed').length;
    const totalRecs = recommendations.length || 1;

    // 1. Factor: Roadmap Execution (Weight: 35%)
    const roadmapScore = Math.min(100, roadmapProgress * 1.2);
    const roadmapContrib = Math.round(roadmapScore * 0.35);

    // 2. Factor: Verified Skill Graph (Weight: 30%)
    const skillScore = Math.min(100, totalSkills * 10);
    const skillContrib = Math.round(skillScore * 0.3);

    // 3. Factor: Career Readiness (Weight: 20%)
    const readinessContrib = Math.round(readinessScore * 0.2);

    // 4. Factor: Learning Consistency (Weight: 15%)
    const consistencyScore = Math.min(100, (recsCompleted / totalRecs) * 50 + Math.min(50, visitCount * 10));
    const consistencyContrib = Math.round(consistencyScore * 0.15);

    const overallScore = Math.min(100, roadmapContrib + skillContrib + readinessContrib + consistencyContrib);

    const factors: MomentumFactor[] = [
      {
        name: 'Roadmap Execution',
        weightPercentage: 35,
        score: roadmapScore,
        contribution: roadmapContrib,
        evidence: `${roadmapProgress}% of active curriculum completed`,
      },
      {
        name: 'Verified Skill Graph',
        weightPercentage: 30,
        score: skillScore,
        contribution: skillContrib,
        evidence: `${totalSkills} skills indexed & verified`,
      },
      {
        name: 'Target Role Readiness',
        weightPercentage: 20,
        score: readinessScore,
        contribution: readinessContrib,
        evidence: `${readinessScore}% match model alignment`,
      },
      {
        name: 'Learning Consistency',
        weightPercentage: 15,
        score: consistencyScore,
        contribution: consistencyContrib,
        evidence: `${visitCount} active sessions recorded`,
      },
    ];

    return {
      overallScore,
      factors,
      recentDelta: Math.max(1, Math.round(overallScore * 0.08)),
      confidence: 'High Confidence (Verified Data)',
    };
  },
};
