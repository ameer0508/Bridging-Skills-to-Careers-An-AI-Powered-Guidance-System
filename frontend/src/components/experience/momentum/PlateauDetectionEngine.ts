export interface PlateauAnalysis {
  isPlateauDetected: boolean;
  observation: string;
  coachingAdvice: string;
  recommendedAction: string;
}

export const PlateauDetectionEngine = {
  detectPlateau(
    roadmapProgress: number,
    totalSkills: number,
    completedRecsCount: number
  ): PlateauAnalysis {
    // Deterministic check: active skills/recs but roadmap progress at 0%
    if (totalSkills > 0 && roadmapProgress === 0 && completedRecsCount === 0) {
      return {
        isPlateauDetected: true,
        observation: 'Your learning consistency is active, but roadmap item completion has stalled over recent sessions.',
        coachingAdvice: 'Focusing on completing one specific roadmap phase item will break through this milestone plateau.',
        recommendedAction: 'Start Today\'s Priority Mission in your Learning Roadmap.',
      };
    }

    return {
      isPlateauDetected: false,
      observation: 'No learning plateau detected. Telemetry indicates healthy progress flow.',
      coachingAdvice: 'Keep executing high-priority recommendations to maintain momentum.',
      recommendedAction: 'Continue current learning path.',
    };
  },
};
