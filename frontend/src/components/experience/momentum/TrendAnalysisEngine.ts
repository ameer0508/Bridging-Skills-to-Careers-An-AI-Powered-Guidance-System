export interface TrendAnalysisResult {
  trendState: 'Rapid Acceleration' | 'Improving' | 'Stable' | 'Plateau' | 'Recovery';
  explanation: string;
  evidence: string;
  recommendation: string;
}

export const TrendAnalysisEngine = {
  analyzeTrend(
    momentumScore: number,
    roadmapProgress: number,
    totalSkills: number
  ): TrendAnalysisResult {
    if (momentumScore >= 70 && roadmapProgress > 30) {
      return {
        trendState: 'Rapid Acceleration',
        explanation: 'Your momentum telemetry indicates strong consistent execution across roadmap milestones.',
        evidence: `Momentum score ${momentumScore}% with ${roadmapProgress}% roadmap progress.`,
        recommendation: 'Maintain your current pace to reach your target readiness benchmark.',
      };
    }

    if (momentumScore >= 40 || totalSkills > 2) {
      return {
        trendState: 'Improving',
        explanation: 'Steady progress detected in skill indexing and foundational learning objectives.',
        evidence: `${totalSkills} verified skills contributing to +${Math.round(momentumScore * 0.2)}% momentum growth.`,
        recommendation: 'Execute upcoming recommendations to unlock next phase topics.',
      };
    }

    return {
      trendState: 'Stable',
      explanation: 'Telemetry is accumulating. Complete active roadmap items to trigger positive momentum trend acceleration.',
      evidence: 'Initial session telemetry active.',
      recommendation: 'Start your daily priority mission today.',
    };
  },
};
