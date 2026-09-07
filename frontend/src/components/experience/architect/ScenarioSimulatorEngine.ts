export interface ScenarioResult {
  scenarioTitle: string;
  projectedMatchScore: number;
  readinessDelta: number;
  unlockedOpportunities: string[];
  rearrangedPhasesCount: number;
  explanation: string;
}

export const ScenarioSimulatorEngine = {
  simulateScenario(
    scenarioType: 'complete_skill' | 'switch_role' | 'increase_effort',
    targetTitle: string,
    currentScore: number
  ): ScenarioResult {
    let projectedMatchScore: number;
    let readinessDelta: number;
    let unlockedOpportunities: string[];
    let rearrangedPhasesCount: number;
    let explanation: string;

    if (scenarioType === 'complete_skill') {
      readinessDelta = 8;
      projectedMatchScore = Math.min(100, currentScore + readinessDelta);
      unlockedOpportunities = ['Advanced API Architecture', 'Cloud Production Deployment'];
      rearrangedPhasesCount = 1;
      explanation = `Completing "${targetTitle}" addresses a high-priority skill gap, elevating your career match score to ${projectedMatchScore}%.`;
    } else if (scenarioType === 'switch_role') {
      projectedMatchScore = 72;
      readinessDelta = projectedMatchScore - currentScore;
      unlockedOpportunities = ['Infrastructure Automation', 'DevOps Pipeline Design'];
      rearrangedPhasesCount = 2;
      explanation = `Switching target role to "${targetTitle}" re-indexes your shared skill graph and recalibrates your active learning roadmap.`;
    } else {
      readinessDelta = 12;
      projectedMatchScore = Math.min(100, currentScore + readinessDelta);
      unlockedOpportunities = ['Accelerated Placement Qualification'];
      rearrangedPhasesCount = 0;
      explanation = `Increasing daily study effort accelerates roadmap completion time by 40%.`;
    }

    return {
      scenarioTitle: `Scenario: ${targetTitle}`,
      projectedMatchScore,
      readinessDelta,
      unlockedOpportunities,
      rearrangedPhasesCount,
      explanation,
    };
  },
};
