import { ICareerRequirement } from '../models/CareerRequirement.js';
import { IUserSkill } from '../models/UserSkill.js';
import { IGapItem } from '../models/GapAnalysis.js';
import { ISkill } from '../models/Skill.js';

export class GapPrioritizer {
  /**
   * Identifies and ranks critical gaps, weak areas, and strengths.
   */
  public static analyze(
    requirements: ICareerRequirement[],
    userSkills: IUserSkill[]
  ): { criticalGaps: IGapItem[]; weakAreas: IGapItem[]; strengthAreas: IGapItem[] } {
    const criticalGaps: IGapItem[] = [];
    const weakAreas: IGapItem[] = [];
    const strengthAreas: IGapItem[] = [];

    const userSkillMap = new Map<string, IUserSkill>();
    for (const us of userSkills) {
      const skill = us.skillId as unknown as ISkill;
      if (skill && skill.canonicalName) {
        userSkillMap.set(skill.canonicalName.toLowerCase(), us);
        skill.aliases.forEach(a => userSkillMap.set(a.toLowerCase(), us));
      }
    }

    for (const req of requirements) {
      const us = userSkillMap.get(req.skillName.toLowerCase());

      const weightMultiplier =
        req.importance === 'required' ? 3 : req.importance === 'preferred' ? 2 : 1;
      const baseImpact = req.weight * weightMultiplier * (100 / 15); // Normalize to roughly 0-100

      if (!us) {
        // Completely missing
        const item: IGapItem = {
          skillName: req.skillName,
          impactScore: Math.round(Math.min(baseImpact * 1.5, 100)), // Extra penalty for missing entirely
          reason:
            req.importance === 'required'
              ? `Critical missing competency. Highly required for this career.`
              : `Missing preferred skill. Learning this would boost competitiveness.`
        };

        if (req.importance === 'required') criticalGaps.push(item);
        else weakAreas.push(item);
      } else {
        // Present, but check if it's a weak area
        if (us.evidenceScore < 40 && req.importance === 'required') {
          weakAreas.push({
            skillName: req.skillName,
            impactScore: Math.round(baseImpact),
            reason: `Evidence indicates limited proficiency (${us.evidenceScore}/100) for a required skill.`
          });
        } else if (us.evidenceScore >= 70) {
          strengthAreas.push({
            skillName: req.skillName,
            impactScore: Math.round(baseImpact),
            reason: `Strong verified proficiency (${us.evidenceScore}/100) covering a ${req.importance} requirement.`
          });
        }
      }
    }

    // Sort by impact score descending
    criticalGaps.sort((a, b) => b.impactScore - a.impactScore);
    weakAreas.sort((a, b) => b.impactScore - a.impactScore);
    strengthAreas.sort((a, b) => b.impactScore - a.impactScore);

    return { criticalGaps, weakAreas, strengthAreas };
  }
}

export default GapPrioritizer;
