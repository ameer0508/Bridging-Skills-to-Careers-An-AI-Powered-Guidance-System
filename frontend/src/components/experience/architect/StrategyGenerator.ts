import { CareerMatchItem, ReadinessItem, RecommendationItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface StrategySummary {
  recommendedRoleTitle: string;
  matchScore: number;
  readinessScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendedSequence: string[];
  potentialBlockers: string[];
  estimatedTotalEffort: string;
  confidenceTier: string;
  evidence: string[];
}

export const StrategyGenerator = {
  generateStrategy(
    matches: CareerMatchItem[],
    readiness: ReadinessItem[],
    totalSkills: number,
    recommendations: RecommendationItem[],
    roadmap: RoadmapData | null
  ): StrategySummary {
    const topMatch = matches[0] || null;
    const topReadiness = readiness[0] || null;

    const recommendedRoleTitle = topMatch?.careerId?.title || 'Target Career Path';
    const matchScore = topMatch?.matchScore || 0;
    const readinessScore = topReadiness?.overallScore || 0;

    const strengths = topMatch?.matchingSkills?.length
      ? topMatch.matchingSkills
      : [`${totalSkills} Verified Competencies Indexed`];

    const weaknesses = topMatch?.missingSkills?.length
      ? topMatch.missingSkills
      : ['Advanced Architecture Standards', 'System Scalability'];

    const recommendedSequence = roadmap?.phases
      ?.flatMap((p) => p.items || [])
      .slice(0, 3)
      .map((i) => i.title) || [
      'Master Database Indexing & Querying',
      'Architect Scalable REST APIs',
      'Implement Production Authentication',
    ];

    const potentialBlockers = [
      'Unresolved skill gaps in core backend architecture',
      'Limited production project evidence',
    ];

    const estimatedTotalEffort = '2-4 Weeks (30 mins/day)';
    const confidenceTier = matchScore >= 75 ? 'High Confidence' : 'Moderate Confidence';

    const evidence = [
      `${matchScore}% career match model alignment`,
      `${readinessScore}% readiness score evaluated`,
      `${totalSkills} skills verified in user graph`,
      `${recommendations.length} recommendations prioritized`,
    ];

    return {
      recommendedRoleTitle,
      matchScore,
      readinessScore,
      strengths,
      weaknesses,
      recommendedSequence,
      potentialBlockers,
      estimatedTotalEffort,
      confidenceTier,
      evidence,
    };
  },
};
