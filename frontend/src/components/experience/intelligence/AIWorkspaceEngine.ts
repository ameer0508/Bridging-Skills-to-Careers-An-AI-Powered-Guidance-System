import { CareerMatchItem, ReadinessItem, RecommendationItem, RoadmapData } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface AINormalizedContext {
  topMatch: CareerMatchItem | null;
  topReadiness: ReadinessItem | null;
  totalSkills: number;
  activeRecommendations: RecommendationItem[];
  roadmap: RoadmapData | null;
  confidenceScore: number;
  confidenceTier: 'High Confidence' | 'Medium Confidence' | 'Evaluating';
  conversationalSummary: string;
}

export const AIWorkspaceEngine = {
  normalizeContext(
    matches: CareerMatchItem[],
    readiness: ReadinessItem[],
    totalSkills: number,
    recommendations: RecommendationItem[],
    roadmap: RoadmapData | null
  ): AINormalizedContext {
    const topMatch = matches[0] || null;
    const topReadiness = readiness[0] || null;

    // Calculate derived confidence score based on backend evidence availability
    let confidenceScore = 0;
    if (topMatch?.matchScore) confidenceScore += 40;
    if (totalSkills > 0) confidenceScore += Math.min(30, totalSkills * 3);
    if (topReadiness?.overallScore) confidenceScore += 30;

    let confidenceTier: 'High Confidence' | 'Medium Confidence' | 'Evaluating' = 'Evaluating';
    if (confidenceScore >= 75) confidenceTier = 'High Confidence';
    else if (confidenceScore >= 40) confidenceTier = 'Medium Confidence';

    // Conversational Summary Synthesis from authentic data
    let conversationalSummary: string;

    if (!topMatch && totalSkills === 0) {
      conversationalSummary =
        'Your profile needs skill inputs or a resume upload to initiate deterministic career matching and roadmap generation.';
    } else if (topMatch) {
      conversationalSummary = `I noticed strong alignment (${topMatch.matchScore}%) for ${topMatch.careerId?.title || 'your target role'}. Focusing on ${
        topMatch.missingSkills?.slice(0, 2).join(' and ') || 'core milestones'
      } will yield the highest readiness impact.`;
    } else {
      conversationalSummary = `Your skill graph contains ${totalSkills} verified competencies. Select a target career path to compute alignment.`;
    }

    return {
      topMatch,
      topReadiness,
      totalSkills,
      activeRecommendations: recommendations.filter((r) => r.status !== 'completed'),
      roadmap,
      confidenceScore,
      confidenceTier,
      conversationalSummary,
    };
  },
};
