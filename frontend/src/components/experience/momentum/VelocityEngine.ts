import { RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface VelocityMetrics {
  roadmapItemsPerWeek: number;
  readinessGainPerWeek: number;
  skillsAcquiredPerMonth: number;
  velocityRating: 'High Velocity' | 'Moderate Velocity' | 'Steady Pace';
}

export const VelocityEngine = {
  calculateVelocity(
    roadmap: RoadmapData | null,
    totalSkills: number,
    readinessScore: number
  ): VelocityMetrics {
    const completedItems =
      roadmap?.phases
        ?.flatMap((p) => p.items || [])
        .filter((i) => i.status === 'completed').length || 0;

    const roadmapItemsPerWeek = Math.max(1, Math.round(completedItems * 0.8 + 1));
    const readinessGainPerWeek = Math.max(2, Math.round(readinessScore * 0.1));
    const skillsAcquiredPerMonth = Math.max(2, Math.round(totalSkills * 0.7));

    let velocityRating: 'High Velocity' | 'Moderate Velocity' | 'Steady Pace' = 'Steady Pace';
    if (roadmapItemsPerWeek >= 3 || readinessGainPerWeek >= 5) velocityRating = 'High Velocity';
    else if (roadmapItemsPerWeek >= 2) velocityRating = 'Moderate Velocity';

    return {
      roadmapItemsPerWeek,
      readinessGainPerWeek,
      skillsAcquiredPerMonth,
      velocityRating,
    };
  },
};
