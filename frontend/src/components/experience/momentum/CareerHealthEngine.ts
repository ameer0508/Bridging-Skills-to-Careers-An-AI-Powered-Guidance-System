import { ReadinessItem, RecommendationItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface HealthDimension {
  dimension: string;
  score: number; // 0-100
  rating: 'Optimal' | 'Healthy' | 'Attention Needed';
  evidence: string;
}

export interface CareerHealthData {
  overallHealthScore: number;
  dimensions: HealthDimension[];
}

export const CareerHealthEngine = {
  evaluateHealth(
    totalSkills: number,
    topReadiness: ReadinessItem | null,
    recommendations: RecommendationItem[],
    roadmap: RoadmapData | null
  ): CareerHealthData {
    const roadmapProgress = roadmap?.progressPercentage || 0;
    const readinessScore = topReadiness?.overallScore || 0;
    const recsCompleted = recommendations.filter((r) => r.status === 'completed').length;

    const dimensions: HealthDimension[] = [
      {
        dimension: 'Roadmap Velocity',
        score: Math.min(100, Math.max(30, roadmapProgress * 1.5)),
        rating: roadmapProgress >= 40 ? 'Optimal' : roadmapProgress >= 10 ? 'Healthy' : 'Attention Needed',
        evidence: `${roadmapProgress}% Roadmap Progress`,
      },
      {
        dimension: 'Skill Breadth',
        score: Math.min(100, Math.max(25, totalSkills * 12)),
        rating: totalSkills >= 5 ? 'Optimal' : totalSkills >= 2 ? 'Healthy' : 'Attention Needed',
        evidence: `${totalSkills} Verified Skills`,
      },
      {
        dimension: 'Readiness Stability',
        score: Math.min(100, Math.max(40, readinessScore)),
        rating: readinessScore >= 60 ? 'Optimal' : readinessScore >= 35 ? 'Healthy' : 'Attention Needed',
        evidence: `${readinessScore}% Score Alignment`,
      },
      {
        dimension: 'Learning Consistency',
        score: Math.min(100, Math.max(50, totalSkills * 10 + roadmapProgress)),
        rating: 'Healthy',
        evidence: 'Session Telemetry Active',
      },
      {
        dimension: 'Recommendation Execution',
        score: Math.min(100, Math.max(20, recsCompleted * 30 + 30)),
        rating: recsCompleted > 0 ? 'Optimal' : 'Healthy',
        evidence: `${recsCompleted} Recommendations Finished`,
      },
    ];

    const overallHealthScore = Math.round(
      dimensions.reduce((acc, curr) => acc + curr.score, 0) / dimensions.length
    );

    return {
      overallHealthScore,
      dimensions,
    };
  },
};
