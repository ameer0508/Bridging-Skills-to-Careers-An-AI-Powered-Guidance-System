import { CareerMatchItem, ReadinessItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export const ProgressNarrativeEngine = {
  generateNarrative(
    userName: string,
    topMatch: CareerMatchItem | null,
    topReadiness: ReadinessItem | null,
    totalSkills: number,
    roadmap: RoadmapData | null
  ): string {
    const roleTitle = topMatch?.careerId?.title || 'your target career';
    const score = topReadiness?.overallScore || 0;
    const progress = roadmap?.progressPercentage || 0;

    if (totalSkills === 0 && !topMatch) {
      return `Welcome to your career strategist workspace, ${userName}. Upload your resume or specify skills to calculate alignment for ${roleTitle}.`;
    }

    if (progress > 0) {
      return `You have completed ${progress}% of your learning roadmap for ${roleTitle}. Your current readiness score is ${score}%, positioning you in the "${topReadiness?.readinessTier || 'Active Evaluation'}" tier.`;
    }

    return `Your verified skill graph contains ${totalSkills} competencies mapped to ${roleTitle}. Completing your upcoming milestone will advance your readiness trajectory.`;
  },
};
