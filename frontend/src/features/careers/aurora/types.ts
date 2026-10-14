/** A stored career match as GET /careers/matches returns it (backend CareerMatch, docs/SCORING.md). */
export interface CareerMatchData {
  id: string;
  careerId: {
    _id: string;
    title: string;
    category: string;
    description: string;
    /** E1: requirements informed by an external occupational source (O*NET). */
    source?: { kind: string; code: string; title: string };
  };
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  /** One-sentence explanation of the score, from the API. */
  summary?: string;
  /** Per-requirement breakdown of the score, from the API (see docs/SCORING.md). */
  breakdown?: Array<{
    skillName: string;
    importance: 'required' | 'preferred' | 'supporting';
    status: 'applied' | 'listed' | 'inferred' | 'missing';
    matchedVia?: string;
    evidenceScore: number;
    pointsEarned: number;
    pointsPossible: number;
  }>;
  confidence: number;
  relatedCareers?: Array<{
    career: {
      _id: string;
      title: string;
      category: string;
    };
    score: number;
  }>;
}
