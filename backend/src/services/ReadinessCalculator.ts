import { ICareerRequirement } from '../models/CareerRequirement.js';
import { IUserSkill } from '../models/UserSkill.js';
import { IDimensionScore } from '../models/CareerReadiness.js';
import { ISkill } from '../models/Skill.js';

export class ReadinessCalculator {
  /**
   * Deterministically calculates readiness across technical, experience, project, and certification dimensions.
   */
  public static calculate(
    requirements: ICareerRequirement[],
    userSkills: IUserSkill[]
  ): { overallScore: number; dimensions: IDimensionScore[]; tier: string } {
    let techEarned = 0;
    let techMax = 0;
    let expEarned = 0;
    let projEarned = 0;
    let certEarned = 0;

    let requiredMissingCount = 0;
    let totalRequirementsCount = requirements.length;

    // Pre-map skills
    const userSkillMap = new Map<string, IUserSkill>();
    for (const us of userSkills) {
      const skill = us.skillId as unknown as ISkill;
      if (skill && skill.canonicalName) {
        userSkillMap.set(skill.canonicalName.toLowerCase(), us);
        skill.aliases.forEach(a => userSkillMap.set(a.toLowerCase(), us));
      }
    }

    for (const req of requirements) {
      const weightMultiplier =
        req.importance === 'required' ? 3 : req.importance === 'preferred' ? 2 : 1;
      const maxPoints = req.weight * weightMultiplier * 100;

      techMax += maxPoints;

      const us = userSkillMap.get(req.skillName.toLowerCase());
      if (us) {
        // Technical dimension (base skill presence)
        techEarned += (us.evidenceScore / 100) * maxPoints;

        // Drill down into evidence types for other dimensions
        const hasExp = us.evidences.some(e => e.sourceType === 'resume_experience');
        const hasProj = us.evidences.some(e => e.sourceType === 'resume_projects');
        const hasCert = us.evidences.some(
          e => e.sourceType === 'resume_certifications' || e.sourceType === 'resume_education'
        );

        // Note: We're simply tracking how many of the requirements they have applied in real contexts
        if (hasExp) expEarned += maxPoints;
        if (hasProj) projEarned += maxPoints;
        if (hasCert) certEarned += maxPoints;
      } else if (req.importance === 'required') {
        requiredMissingCount++;
      }
    }

    if (techMax === 0) {
      return { overallScore: 0, dimensions: [], tier: 'Not Ready' };
    }

    const techScore = (techEarned / techMax) * 100;
    const expScore = (expEarned / techMax) * 100; // Normalizing against total requirements weight
    const projScore = (projEarned / techMax) * 100;
    const certScore = (certEarned / techMax) * 100;

    const dimensions: IDimensionScore[] = [
      { name: 'Technical Skills', score: Math.round(techScore), weight: 0.5 },
      { name: 'Professional Experience', score: Math.round(expScore), weight: 0.25 },
      { name: 'Project Portfolio', score: Math.round(projScore), weight: 0.15 },
      { name: 'Education & Certifications', score: Math.round(certScore), weight: 0.1 }
    ];

    let overallScore = dimensions.reduce((acc, dim) => acc + dim.score * dim.weight, 0);

    // Hard penalty for missing required skills (up to 40% reduction of final readiness)
    if (requiredMissingCount > 0) {
      const penalty = (requiredMissingCount / Math.max(1, totalRequirementsCount)) * 0.4;
      overallScore = overallScore * (1 - penalty);
    }

    overallScore = Math.round(Math.min(overallScore, 100));

    let tier = 'Not Ready';
    if (overallScore >= 80) tier = 'Senior Level Ready';
    else if (overallScore >= 60) tier = 'Mid Level Ready';
    else if (overallScore >= 35) tier = 'Entry Level Ready';

    return { overallScore, dimensions, tier };
  }
}

export default ReadinessCalculator;
