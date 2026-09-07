import { RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface Achievement {
  id: string;
  title: string;
  category: string;
  reason: string;
  evidence: string;
  dateEarned: string;
  relatedSkills: string[];
  impactScore: number;
}

export const AchievementEngine = {
  evaluateAchievements(
    totalSkills: number,
    readinessScore: number,
    roadmap: RoadmapData | null,
    targetRole?: string
  ): Achievement[] {
    const achievements: Achievement[] = [];

    if (totalSkills > 0) {
      achievements.push({
        id: 'ach-skills-init',
        title: 'Skill Graph Initialized',
        category: 'Skill Verification',
        reason: 'Successfully indexed verified competency graph.',
        evidence: `${totalSkills} Skills Normalized`,
        dateEarned: 'Active Session',
        relatedSkills: ['Skill Taxonomy', 'Profile Verification'],
        impactScore: 15,
      });
    }

    if (readinessScore >= 50) {
      achievements.push({
        id: 'ach-readiness-mid',
        title: 'Core Competency Threshold Achieved',
        category: 'Career Readiness',
        reason: 'Evaluated at over 50% overall technical readiness.',
        evidence: `${readinessScore}% Overall Readiness Score`,
        dateEarned: 'Active Session',
        relatedSkills: [targetRole || 'Technical Foundations'],
        impactScore: 30,
      });
    }

    const completedItems =
      roadmap?.phases
        ?.flatMap((p) => p.items || [])
        .filter((i) => i.status === 'completed') || [];

    if (completedItems.length > 0) {
      achievements.push({
        id: 'ach-roadmap-first',
        title: 'Roadmap Milestone Completed',
        category: 'Curriculum Progress',
        reason: 'Demonstrated completion of foundational curriculum milestone.',
        evidence: `${completedItems.length} Milestone(s) Verified`,
        dateEarned: 'Recent Completion',
        relatedSkills: completedItems.map((i) => i.title).slice(0, 3),
        impactScore: 25,
      });
    }

    return achievements;
  },
};
