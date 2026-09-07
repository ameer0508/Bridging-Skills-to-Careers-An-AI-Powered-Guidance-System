import { ICareerRequirement } from '../models/CareerRequirement.js';
import { IUserSkill } from '../models/UserSkill.js';
import { ISkill } from '../models/Skill.js';

export class ExplanationGenerator {
  /**
   * Generates readable explainable AI strengths and weaknesses based on evidence.
   */
  public static generate(
    requirements: ICareerRequirement[],
    userSkills: IUserSkill[],
    missingSkills: string[]
  ): { strengths: string[]; weaknesses: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    const reqMap = new Map<string, ICareerRequirement>();
    for (const req of requirements) {
      reqMap.set(req.skillName.toLowerCase(), req);
    }

    // Process strengths (matching skills with evidence)
    for (const us of userSkills) {
      const skill = us.skillId as unknown as ISkill;
      if (!skill) continue;

      const req = reqMap.get(skill.canonicalName.toLowerCase());
      if (req) {
        if (us.evidenceScore >= 75) {
          strengths.push(
            `✓ Strong ${skill.canonicalName} evidence (${us.evidenceScore}% proficiency context)`
          );
        } else if (us.evidenceScore >= 40) {
          strengths.push(`✓ Demonstrated ${skill.canonicalName} capability`);
        }

        // Add explicit context if it comes from experience
        const expEvidence = us.evidences.find(e => e.sourceType === 'resume_experience');
        if (expEvidence && us.evidenceScore >= 50) {
          strengths.push(`✓ Applied ${skill.canonicalName} in professional experience`);
        }
      }
    }

    // Filter strengths to top 5 most impactful to avoid noise
    const topStrengths = [...new Set(strengths)].slice(0, 5);

    // Process weaknesses
    for (const missing of missingSkills) {
      const req = reqMap.get(missing.toLowerCase());
      if (req && req.importance === 'required') {
        weaknesses.push(`✗ Missing critical requirement: ${missing}`);
      } else if (req && req.importance === 'preferred') {
        weaknesses.push(`- Lacks preferred skill: ${missing}`);
      }
    }

    // Suggest alternative paths if missing many core skills
    if (weaknesses.length > requirements.length / 2) {
      weaknesses.push(`! Core competency gaps indicate this may be a stretch role.`);
    }

    const topWeaknesses = [...new Set(weaknesses)].slice(0, 5);

    return { strengths: topStrengths, weaknesses: topWeaknesses };
  }
}

export default ExplanationGenerator;
