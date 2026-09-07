import { RecommendationItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface Mission {
  id: string;
  title: string;
  category: string;
  reason: string;
  expectedOutcome: string;
  estimatedTime: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  isCompleted: boolean;
  type: 'daily' | 'sprint' | 'weekly' | 'long_term';
}

export const MissionEngine = {
  generateMissions(
    roadmap: RoadmapData | null,
    recommendations: RecommendationItem[]
  ): Mission[] {
    const missions: Mission[] = [];

    // Daily Priority Mission from Roadmap Phase or Recommendations
    const activePhase = roadmap?.phases?.[0];
    const pendingRoadmapItem = activePhase?.items?.find((i) => i.status !== 'completed');

    if (pendingRoadmapItem) {
      missions.push({
        id: 'mission-daily',
        title: pendingRoadmapItem.title,
        category: activePhase?.title || 'Active Roadmap Phase',
        reason: 'Direct milestone required to advance your current learning roadmap.',
        expectedOutcome: 'Increases role readiness score and unlocks next phase topics.',
        estimatedTime: '30-45 mins',
        priority: 'high',
        isCompleted: false,
        type: 'daily',
      });
    }

    // Weekly Objective from Recommendations
    const topRec = recommendations.find((r) => r.status !== 'completed');
    if (topRec) {
      missions.push({
        id: 'mission-weekly',
        title: topRec.title,
        category: topRec.category || 'Skill Gap Recommendation',
        reason: topRec.reason || 'Synthesized by AI to address a critical market competency gap.',
        expectedOutcome: `Adds +${topRec.impact || 10}% readiness score upon completion.`,
        estimatedTime: topRec.estimatedTime || '60 mins',
        priority: (topRec.priority as 'critical' | 'high' | 'medium') || 'high',
        isCompleted: false,
        type: 'weekly',
      });
    }

    // Sprint & Long-Term Goal
    missions.push({
      id: 'mission-sprint',
      title: activePhase?.title || 'Phase 1 Core Foundations',
      category: 'Current Sprint',
      reason: 'Structured foundational milestone block for target role competency.',
      expectedOutcome: 'Complete 100% of Phase 1 curriculum items.',
      estimatedTime: '1-2 weeks',
      priority: 'medium',
      isCompleted: (roadmap?.progressPercentage || 0) >= 50,
      type: 'sprint',
    });

    missions.push({
      id: 'mission-long-term',
      title: 'Target Role Readiness Mastery',
      category: 'Career Goal',
      reason: 'Achieve 85%+ readiness score to qualify for senior technical evaluation.',
      expectedOutcome: 'Qualify for AI-vetted job recommendations & career placement.',
      estimatedTime: '1-3 months',
      priority: 'high',
      isCompleted: false,
      type: 'long_term',
    });

    return missions;
  },
};
