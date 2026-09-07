import { CareerMatchItem } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface PathComparisonItem {
  id: string;
  title: string;
  matchScore: number;
  matchingSkillsCount: number;
  missingSkillsCount: number;
  category: string;
  isRecommended: boolean;
  roadmapOverlapPercentage: number;
}

export const CareerPathComparisonEngine = {
  comparePaths(matches: CareerMatchItem[]): PathComparisonItem[] {
    if (!matches || matches.length === 0) {
      return [
        {
          id: 'path-default-1',
          title: 'Full Stack Engineer',
          matchScore: 85,
          matchingSkillsCount: 4,
          missingSkillsCount: 2,
          category: 'Software Engineering',
          isRecommended: true,
          roadmapOverlapPercentage: 80,
        },
        {
          id: 'path-default-2',
          title: 'Cloud Architect',
          matchScore: 65,
          matchingSkillsCount: 2,
          missingSkillsCount: 4,
          category: 'Infrastructure',
          isRecommended: false,
          roadmapOverlapPercentage: 50,
        },
      ];
    }

    return matches.slice(0, 4).map((m, idx) => ({
      id: m.careerId?._id || `match-${idx}`,
      title: m.careerId?.title || 'Target Role',
      matchScore: m.matchScore,
      matchingSkillsCount: m.matchingSkills?.length || 0,
      missingSkillsCount: m.missingSkills?.length || 0,
      category: m.careerId?.category || 'Engineering',
      isRecommended: idx === 0,
      roadmapOverlapPercentage: Math.max(30, Math.round(m.matchScore * 0.9)),
    }));
  },
};
