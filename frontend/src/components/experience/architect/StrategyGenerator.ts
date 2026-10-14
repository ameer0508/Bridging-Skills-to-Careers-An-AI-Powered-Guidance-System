import { CareerMatchItem, ReadinessItem, RecommendationItem, RoadmapData } from '../../../types/telemetry';
import { listFrom } from '../../../lib/collections';

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
    matches: CareerMatchItem[] = [],
    readiness: ReadinessItem[] = [],
    totalSkills = 0,
    recommendations: RecommendationItem[] = [],
    roadmap: RoadmapData | null = null
  ): StrategySummary {
    try {
      const safeMatches = Array.isArray(matches) ? matches : [];
      const safeReadiness = Array.isArray(readiness) ? readiness : [];
      const safeTotalSkills = typeof totalSkills === 'number' ? totalSkills : 0;

      const topMatch = safeMatches[0] || null;
      const topReadiness = safeReadiness[0] || null;

      const recommendedRoleTitle = topMatch?.careerId?.title || 'Target Career Path';
      const matchScore = topMatch?.matchScore || 0;
      const readinessScore = topReadiness?.overallScore || 0;

      const strengths = topMatch?.matchingSkills?.length
        ? topMatch.matchingSkills
        : [`${safeTotalSkills} Skills Indexed`];

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
      const safeRecs = listFrom<RecommendationItem>(recommendations, 'recommendations');

      // Derive Confidence Tier reliably
      const confidenceTier =
        matchScore >= 75 && readinessScore >= 60
          ? 'High Confidence'
          : matchScore >= 40 || readinessScore >= 40
          ? 'Moderate Confidence'
          : 'Evaluating';

      const evidence = [
        `${matchScore}% career match model alignment`,
        `${readinessScore}% readiness score evaluated`,
        `${safeTotalSkills} skills on your profile`,
        `${safeRecs.length} recommendations prioritized`,
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
    } catch (err) {
      console.warn('StrategyGenerator: Error generating strategy, returning defensive fallback', err);
      return {
        recommendedRoleTitle: 'Target Career Direction',
        matchScore: 0,
        readinessScore: 0,
        strengths: [`${totalSkills || 0} Skills on Profile`],
        weaknesses: ['Curriculum Initializing'],
        recommendedSequence: ['Explore Career Matches', 'Complete Skill Diagnostic'],
        potentialBlockers: ['Requires skill evidence'],
        estimatedTotalEffort: 'Adaptive',
        confidenceTier: 'Evaluating',
        evidence: ['Baseline telemetry initialized'],
      };
    }
  },
};
