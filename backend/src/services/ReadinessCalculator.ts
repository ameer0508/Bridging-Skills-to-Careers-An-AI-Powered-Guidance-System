import { ICareerRequirement } from '../models/CareerRequirement.js';
import { IUserSkill } from '../models/UserSkill.js';
import { IDimensionScore, type IEvidenceBasis } from '../models/CareerReadiness.js';
import { buildUserSkillIndex, findUserSkill } from '../utils/skillMatching.js';

export class ReadinessCalculator {
  /**
   * Deterministically calculates readiness across technical, experience, project, and certification dimensions.
   */
  public static calculate(
    requirements: ICareerRequirement[],
    userSkills: IUserSkill[]
  ): { overallScore: number; dimensions: IDimensionScore[]; tier: string; interpretation: string } {
    let techEarned = 0;
    let techMax = 0;
    let expEarned = 0;
    let projEarned = 0;
    let certEarned = 0;

    let requiredMissingCount = 0;
    let totalRequirementsCount = requirements.length;

    // Pre-map skills
    const userSkillIndex = buildUserSkillIndex(userSkills);

    for (const req of requirements) {
      const weightMultiplier =
        req.importance === 'required' ? 3 : req.importance === 'preferred' ? 2 : 1;
      const maxPoints = req.weight * weightMultiplier * 100;

      techMax += maxPoints;

      const us = findUserSkill(userSkillIndex, req.skillName);
      if (us) {
        // Technical dimension (base skill presence)
        techEarned += (us.evidenceScore / 100) * maxPoints;

        // Drill down into evidence types for other dimensions
        const hasExp = us.evidences.some(e => e.sourceType === 'resume_experience');
        const hasProj = us.evidences.some(
          e => e.sourceType === 'resume_projects' || (e.sourceType === 'portfolio_project' && (e.points || 0) > 0)
        );
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
      return {
        overallScore: 0,
        dimensions: [],
        tier: 'Early stage',
        interpretation: 'No skill requirements are defined for this career.'
      };
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

    // Tiers describe how much resume evidence exists. They deliberately make no claim about
    // seniority or employability.
    let tier = 'Early stage';
    if (overallScore >= 75) tier = 'Strong evidence';
    else if (overallScore >= 50) tier = 'Solid foundation';
    else if (overallScore >= 25) tier = 'Developing';

    const requiredTotal = requirements.filter(r => r.importance === 'required').length;
    const requiredMet = requiredTotal - requiredMissingCount;
    const interpretation =
      `${tier}: your resume shows evidence for ${requiredMet} of ${requiredTotal} required skills. ` +
      'Readiness measures how well your resume evidences the skill baseline for this career ' +
      '(skills 50%, work experience 25%, projects 15%, education and certifications 10%). ' +
      'It is not a prediction of interview or hiring outcomes.';

    return { overallScore, dimensions, tier, interpretation };
  }

  /**
   * How much of the credited skill evidence was checked, and how. Each covered requirement
   * contributes its credited points (evidence score x weight x importance), divided among the
   * kinds of evidence behind the skill in proportion to their points.
   *
   * This describes the evidence; it does not change the readiness score. Readiness has not been
   * calibrated against interview or hiring outcomes, because SkillBridge holds no such data.
   */
  public static evidenceBasis(requirements: ICareerRequirement[], userSkills: IUserSkill[]): IEvidenceBasis {
    const index = buildUserSkillIndex(userSkills);
    const credited = { assessed: 0, selfReported: 0, stated: 0, inferred: 0 };
    let covered = 0;
    let assessedCount = 0;
    let requiredMissing = 0;

    for (const req of requirements) {
      const match = findUserSkill(index, req.skillName);
      if (!match) {
        if (req.importance === 'required') requiredMissing++;
        continue;
      }
      covered++;
      const multiplier = req.importance === 'required' ? 3 : req.importance === 'preferred' ? 2 : 1;
      const points = (match.evidenceScore / 100) * req.weight * multiplier;
      if (match.inferredFrom) {
        credited.inferred += points;
        continue;
      }
      if (match.evidences.some(e => e.sourceType === 'assessment')) assessedCount++;
      const byKind = { assessed: 0, selfReported: 0, stated: 0 };
      for (const evidence of match.evidences) {
        const value = evidence.points ?? 0;
        if (evidence.sourceType === 'assessment') byKind.assessed += value;
        else if (evidence.sourceType === 'portfolio_project') byKind.selfReported += value;
        else if (evidence.sourceType.startsWith('resume_')) byKind.stated += value;
      }
      const total = byKind.assessed + byKind.selfReported + byKind.stated;
      if (total === 0) {
        // Records made before points were stored per evidence can only have come from a resume
        credited.stated += points;
        continue;
      }
      credited.assessed += (points * byKind.assessed) / total;
      credited.selfReported += (points * byKind.selfReported) / total;
      credited.stated += (points * byKind.stated) / total;
    }

    const counts = {
      requirementsTotal: requirements.length,
      requirementsCovered: covered,
      requirementsAssessed: assessedCount,
      requiredMissing
    };
    const sum = credited.assessed + credited.selfReported + credited.stated + credited.inferred;
    if (sum === 0) return { assessed: null, selfReported: null, stated: null, inferred: null, ...counts };

    // Whole percentages that add up to exactly 100 (largest remainders get the spare points)
    const kinds = ['assessed', 'selfReported', 'stated', 'inferred'] as const;
    const exact = kinds.map(kind => (credited[kind] / sum) * 100);
    const shares = exact.map(Math.floor);
    let spare = 100 - shares.reduce((a, b) => a + b, 0);
    for (const i of exact.map((value, position) => [value - Math.floor(value), position]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map(pair => pair[1])) {
      if (spare <= 0) break;
      shares[i]++;
      spare--;
    }
    return { assessed: shares[0], selfReported: shares[1], stated: shares[2], inferred: shares[3], ...counts };
  }
}

export default ReadinessCalculator;
