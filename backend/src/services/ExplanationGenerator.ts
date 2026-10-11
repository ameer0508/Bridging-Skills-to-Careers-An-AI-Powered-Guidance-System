import { IRequirementBreakdown } from '../models/CareerMatch.js';

export class ExplanationGenerator {
  /**
   * Turns the per-requirement score breakdown into plain-language strengths and gaps.
   * Every statement is derived from a specific requirement and the evidence found for it.
   */
  public static generate(breakdown: IRequirementBreakdown[]): {
    strengths: string[];
    weaknesses: string[];
    summary: string;
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    const byImpact = [...breakdown].sort((a, b) => b.pointsPossible - a.pointsPossible);

    for (const item of byImpact) {
      const label = `${item.importance} skill`;
      if (item.status === 'applied') {
        strengths.push(
          `${item.skillName}: used in your experience or projects (evidence ${item.evidenceScore}/100, ${label})`
        );
      } else if (item.status === 'inferred') {
        strengths.push(
          `${item.skillName}: inferred from your ${item.matchedVia} evidence (${label}); listing it explicitly would strengthen this`
        );
      } else if (item.status === 'listed') {
        weaknesses.push(
          `${item.skillName}: listed on your resume but not shown in any role or project (${label})`
        );
      } else {
        weaknesses.push(`${item.skillName}: no evidence found on your resume (${label})`);
      }
    }

    const total = breakdown.length;
    const covered = breakdown.filter(b => b.status !== 'missing').length;
    const required = breakdown.filter(b => b.importance === 'required');
    const requiredCovered = required.filter(b => b.status !== 'missing').length;

    const summary =
      total === 0
        ? 'No skill requirements are defined for this career.'
        : `Your resume evidences ${covered} of ${total} skills for this career` +
          (required.length > 0 ? `, including ${requiredCovered} of ${required.length} required skills.` : '.');

    return { strengths: strengths.slice(0, 6), weaknesses: weaknesses.slice(0, 6), summary };
  }
}

export default ExplanationGenerator;
