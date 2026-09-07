import { ICareerRequirement } from '../models/CareerRequirement.js';
import { IUserSkill } from '../models/UserSkill.js';
import { ISkill } from '../models/Skill.js';

export interface ScoreResult {
  totalScore: number; // 0-100
  matchingSkills: string[];
  missingSkills: string[];
  confidence: number;
}

export class CareerScoringEngine {
  /**
   * Deterministically calculates the match score between a user's skills and a career's requirements.
   */
  public static calculateScore(
    requirements: ICareerRequirement[],
    userSkills: IUserSkill[] // Populated with skillId
  ): ScoreResult {
    let maxPossibleScore = 0;
    let earnedScore = 0;
    let requiredMatches = 0;
    let requiredCount = 0;

    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    // Pre-map user skills for fast lookup (using canonical names)
    const userSkillMap = new Map<string, number>(); // Name -> evidenceScore
    for (const us of userSkills) {
      const skill = us.skillId as unknown as ISkill;
      if (skill && skill.canonicalName) {
        userSkillMap.set(skill.canonicalName.toLowerCase(), us.evidenceScore);

        // Also map aliases just in case
        skill.aliases.forEach(a => {
          userSkillMap.set(a.toLowerCase(), us.evidenceScore);
        });
      }
    }

    // Evaluate each requirement
    for (const req of requirements) {
      // Importance modifiers
      let multiplier = 1;
      if (req.importance === 'required') {
        multiplier = 3;
        requiredCount++;
      } else if (req.importance === 'preferred') {
        multiplier = 2;
      } else if (req.importance === 'supporting') {
        multiplier = 1;
      }

      // Max score for this requirement based on its weight and importance
      const maxReqScore = req.weight * multiplier * 100; // if evidence score was 100
      maxPossibleScore += maxReqScore;

      // Check if user has this skill
      const userEvidenceScore = userSkillMap.get(req.skillName.toLowerCase());

      if (userEvidenceScore !== undefined) {
        // User has the skill
        earnedScore += (userEvidenceScore / 100) * maxReqScore;
        matchingSkills.push(req.skillName);

        if (req.importance === 'required') {
          requiredMatches++;
        }
      } else {
        // User is missing the skill
        missingSkills.push(req.skillName);
      }
    }

    if (maxPossibleScore === 0) {
      return { totalScore: 0, matchingSkills, missingSkills, confidence: 0 };
    }

    let finalScore = (earnedScore / maxPossibleScore) * 100;

    // Penalize heavily if missing required skills (deterministic cap)
    if (requiredCount > 0 && requiredMatches < requiredCount) {
      const missingRatio = (requiredCount - requiredMatches) / requiredCount;
      finalScore = finalScore * (1 - missingRatio * 0.5); // Drops score by up to 50%
    }

    // Calculate confidence based on data volume
    // High confidence if they have many mapped skills and requirements are thoroughly tested
    let confidence = 50; // Baseline
    if (userSkills.length > 5) confidence += 20;
    if (userSkills.length > 10) confidence += 10;
    if (userSkills.length > 20) confidence += 10;
    if (requirements.length > 5) confidence += 10;

    return {
      totalScore: Math.round(finalScore),
      matchingSkills,
      missingSkills,
      confidence: Math.min(confidence, 100)
    };
  }
}

export default CareerScoringEngine;
