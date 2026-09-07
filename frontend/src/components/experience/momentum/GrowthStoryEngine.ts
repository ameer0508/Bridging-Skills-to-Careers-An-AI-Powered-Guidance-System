import { CareerMatchItem, ReadinessItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface GrowthStoryData {
  headline: string;
  narrativeParagraph: string;
  evidenceChips: string[];
}

export const GrowthStoryEngine = {
  generateGrowthStory(
    userName: string,
    topMatch: CareerMatchItem | null,
    topReadiness: ReadinessItem | null,
    totalSkills: number,
    roadmap: RoadmapData | null
  ): GrowthStoryData {
    const roleTitle = topMatch?.careerId?.title || 'your target career';
    const score = topReadiness?.overallScore || 0;
    const progress = roadmap?.progressPercentage || 0;

    const headline = `Professional Growth Journey: ${roleTitle}`;
    const narrativeParagraph = `Since initiating your ${roleTitle} path, you have indexed ${totalSkills} verified competencies, achieved a ${score}% career readiness rating, and completed ${progress}% of your structured curriculum roadmap. Maintaining this trajectory will position you for technical evaluation and job placement.`;

    const evidenceChips = [
      `${totalSkills} Verified Skills`,
      `${score}% Readiness Rating`,
      `${progress}% Roadmap Complete`,
      `Target Role: ${roleTitle}`,
    ];

    return {
      headline,
      narrativeParagraph,
      evidenceChips,
    };
  },
};
