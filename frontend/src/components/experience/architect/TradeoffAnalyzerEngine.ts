import { CareerMatchItem } from '../../../workspaces/HomeWorkspace/HomeWorkspace';

export interface TradeoffAnalysisResult {
  pathA: { title: string; score: number; uniqueGaps: string[] };
  pathB: { title: string; score: number; uniqueGaps: string[] };
  sharedSkills: string[];
  additionalLearningHours: number;
  readinessDelta: number;
  recommendedChoice: string;
  reasoning: string;
}

export const TradeoffAnalyzerEngine = {
  analyzeTradeoffs(matchA: CareerMatchItem, matchB: CareerMatchItem): TradeoffAnalysisResult {
    const titleA = matchA.careerId?.title || 'Primary Path';
    const titleB = matchB.careerId?.title || 'Alternative Path';

    const scoreA = matchA.matchScore || 80;
    const scoreB = matchB.matchScore || 65;

    const sharedSkills = matchA.matchingSkills?.filter((s) => matchB.matchingSkills?.includes(s)) || [
      'Core Programming',
      'Git Version Control',
    ];

    const uniqueGapsA = matchA.missingSkills || ['System Architecture'];
    const uniqueGapsB = matchB.missingSkills || ['Cloud Infrastructure', 'Kubernetes'];

    const readinessDelta = Math.abs(scoreA - scoreB);
    const additionalLearningHours = uniqueGapsB.length * 15;

    const recommendedChoice = scoreA >= scoreB ? titleA : titleB;
    const reasoning = `${recommendedChoice} provides a higher immediate match score (+${readinessDelta}%) and requires fewer additional learning hours (${additionalLearningHours} hrs vs ${uniqueGapsA.length * 15} hrs).`;

    return {
      pathA: { title: titleA, score: scoreA, uniqueGaps: uniqueGapsA },
      pathB: { title: titleB, score: scoreB, uniqueGaps: uniqueGapsB },
      sharedSkills,
      additionalLearningHours,
      readinessDelta,
      recommendedChoice,
      reasoning,
    };
  },
};
