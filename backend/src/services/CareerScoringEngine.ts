import { ICareerRequirement } from '../models/CareerRequirement.js';
import { IUserSkill } from '../models/UserSkill.js';
import { IRequirementBreakdown, RequirementStatus } from '../models/CareerMatch.js';
import { buildUserSkillIndex, findUserSkill, hasAppliedEvidence } from '../utils/skillMatching.js';

export interface ScoreResult {
  totalScore: number; // 0-100
  matchingSkills: string[];
  missingSkills: string[];
  confidence: number;
  breakdown: IRequirementBreakdown[];
  missingRequiredCount: number;
  requiredCount: number;
}

/** Weight multiplier per requirement importance. */
export const IMPORTANCE_MULTIPLIER = { required: 3, preferred: 2, supporting: 1 } as const;

/**
 * Credit for a requirement the candidate has: half for having it at all, the other half
 * scaled by how strong the evidence is. A skill that is only listed earns ~55%; one used
 * across jobs and projects earns up to 100%.
 */
export const requirementCredit = (evidenceScore: number): number =>
  0.5 + 0.5 * (Math.max(0, Math.min(100, evidenceScore)) / 100);

/** Share of the score removed when every required skill is missing (scaled by the share missing). */
export const MISSING_REQUIRED_PENALTY = 0.3;

export class CareerScoringEngine {
  /**
   * Career match score: how much of a career's skill profile the candidate covers.
   *
   *   score = 100 x sum(points earned) / sum(points possible) x (1 - penalty)
   *
   *   points possible = requirement weight (1-5) x importance (required 3, preferred 2, supporting 1)
   *   points earned   = points possible x requirementCredit(evidence) when the skill is evidenced,
   *                     otherwise 0
   *   penalty         = MISSING_REQUIRED_PENALTY x (required skills missing / required skills)
   *
   * 0 means none of the career's skills appear in the candidate's evidence. 100 means every
   * skill is covered with the strongest evidence. It measures skill coverage against a curated
   * baseline of requirements; it is not a prediction of hiring outcomes.
   */
  public static calculateScore(
    requirements: ICareerRequirement[],
    userSkills: IUserSkill[] // Populated with skillId
  ): ScoreResult {
    const userSkillIndex = buildUserSkillIndex(userSkills);
    const breakdown: IRequirementBreakdown[] = [];
    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    let pointsPossible = 0;
    let pointsEarned = 0;
    let requiredCount = 0;
    let missingRequiredCount = 0;
    let appliedCount = 0;

    for (const req of requirements) {
      const possible = req.weight * (IMPORTANCE_MULTIPLIER[req.importance] ?? 1);
      pointsPossible += possible;
      if (req.importance === 'required') requiredCount++;

      const match = findUserSkill(userSkillIndex, req.skillName);
      let status: RequirementStatus = 'missing';
      let earned = 0;

      if (match) {
        earned = possible * requirementCredit(match.evidenceScore);
        const applied = hasAppliedEvidence(match.evidences);
        status = match.inferredFrom ? 'inferred' : applied ? 'applied' : 'listed';
        if (status === 'applied') appliedCount++;
        matchingSkills.push(req.skillName);
      } else {
        missingSkills.push(req.skillName);
        if (req.importance === 'required') missingRequiredCount++;
      }

      pointsEarned += earned;
      breakdown.push({
        skillName: req.skillName,
        importance: req.importance,
        weight: req.weight,
        status,
        evidenceScore: match ? match.evidenceScore : 0,
        matchedVia: match ? match.canonicalName : undefined,
        pointsEarned: Math.round(earned * 100) / 100,
        pointsPossible: possible
      });
    }

    if (pointsPossible === 0) {
      return {
        totalScore: 0,
        matchingSkills,
        missingSkills,
        confidence: 0,
        breakdown,
        missingRequiredCount,
        requiredCount
      };
    }

    const coverage = pointsEarned / pointsPossible;
    const penalty =
      requiredCount > 0 ? MISSING_REQUIRED_PENALTY * (missingRequiredCount / requiredCount) : 0;

    // Confidence: share of the matched requirements backed by applied evidence (work, project
    // or certification) rather than a bare listing or an inference.
    const confidence =
      matchingSkills.length > 0 ? Math.round((appliedCount / matchingSkills.length) * 100) : 0;

    return {
      totalScore: Math.round(coverage * (1 - penalty) * 100),
      matchingSkills,
      missingSkills,
      confidence,
      breakdown,
      missingRequiredCount,
      requiredCount
    };
  }
}

export default CareerScoringEngine;
