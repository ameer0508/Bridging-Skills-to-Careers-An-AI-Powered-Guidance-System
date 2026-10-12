import { IParsedResume } from '../models/ParsedResume.js';
import { IEvidence, ProficiencyLevel } from '../models/UserSkill.js';
import { escapeRegExp } from '../utils/skillMatching.js';
import { parsePeriodEnd } from '../utils/periods.js';

/**
 * Points awarded per kind of resume evidence. Repeats give diminishing returns so that
 * mentioning a skill many times cannot inflate the score: what counts is the variety of
 * evidence (used at work, used in a project, certified), not the number of mentions.
 */
export const EVIDENCE_POINTS = {
  experience: [40, 15, 5], // 1st role, 2nd role, each further role
  projects: [25, 10, 5], // 1st project, 2nd project, each further project
  education: 15,
  certification: 30,
  listed: 10,
  // Passing a SkillBridge skill check; not resume evidence, counted once per skill
  assessment: 15
} as const;

const stepped = (steps: readonly number[], occurrence: number): number =>
  steps[Math.min(occurrence, steps.length - 1)];

export class EvidenceCalculator {
  /**
   * Maps an evidence score to a proficiency estimate.
   * This is an estimate from resume evidence only: a skill that is merely listed stays
   * "beginner" until experience, project or certification evidence backs it up.
   */
  public static estimateProficiency(evidenceScore: number): ProficiencyLevel {
    if (evidenceScore >= 85) return 'expert';
    if (evidenceScore >= 60) return 'advanced';
    if (evidenceScore >= 35) return 'intermediate';
    return 'beginner';
  }

  /**
   * Calculates the evidence score (0-100) and the evidence records for one skill by looking
   * for it in each part of the parsed resume.
   */
  public static calculateForSkill(
    canonicalName: string,
    aliases: string[],
    parsedResume: IParsedResume
  ): { score: number; evidences: IEvidence[] } {
    let score = 0;
    const evidences: IEvidence[] = [];
    const recordedAt = new Date();
    const searchTerms = [
      ...new Set([canonicalName, ...aliases].map(t => t.toLowerCase().trim()))
    ].filter(Boolean);

    // Whole-term match: "Java" must not match "JavaScript", "C" must not match "C++".
    // Lookarounds are used instead of \b so terms such as "C++" and ".NET" still match.
    const termPatterns = searchTerms.map(
      // The leading "." exclusion stops the alias "js" from matching inside "Node.js"
      term => new RegExp(`(?<![a-z0-9+#.])${escapeRegExp(term)}(?![a-z0-9+#])`, 'i')
    );

    const containsSkill = (text: string | undefined | null): boolean => {
      if (!text) return false;
      return termPatterns.some(pattern => pattern.test(text));
    };
    const anyContains = (items: Array<{ value?: string } | null | undefined> | undefined): boolean =>
      (items || []).some(item => containsSkill(item?.value));

    // 1. Work experience (strongest evidence)
    let rolesWithSkill = 0;
    for (const exp of parsedResume.experience || []) {
      if (containsSkill(exp.role?.value) || anyContains(exp.responsibilities)) {
        const points = stepped(EVIDENCE_POINTS.experience, rolesWithSkill);
        // A role's dates say when the skill was last used there; other evidence carries no date
        const period = parsePeriodEnd(exp.duration?.value, recordedAt);
        score += points;
        rolesWithSkill++;
        evidences.push({
          sourceType: 'resume_experience',
          sourceId: parsedResume.id,
          description: `Used at ${exp.company?.value || 'a previous employer'} as ${exp.role?.value || 'an employee'}`,
          weight: 0.8,
          points,
          observedAt: period.end,
          ongoing: period.ongoing,
          verification: 'stated',
          recordedAt
        });
      }
    }

    // 2. Projects
    let projectsWithSkill = 0;
    for (const proj of parsedResume.projects || []) {
      if (
        containsSkill(proj.name?.value) ||
        containsSkill(proj.description?.value) ||
        anyContains(proj.technologies) ||
        anyContains(proj.contributions)
      ) {
        const points = stepped(EVIDENCE_POINTS.projects, projectsWithSkill);
        score += points;
        projectsWithSkill++;
        evidences.push({
          sourceType: 'resume_projects',
          sourceId: parsedResume.id,
          description: `Applied in project: ${proj.name?.value || 'Unnamed project'}`,
          label: proj.name?.value || undefined,
          weight: 0.6,
          points,
          observedAt: null,
          verification: 'stated',
          recordedAt
        });
      }
    }

    // 3. Education (counted once)
    const education = (parsedResume.education || []).find(
      edu => containsSkill(edu.degree?.value) || containsSkill(edu.branch?.value)
    );
    if (education) {
      score += EVIDENCE_POINTS.education;
      evidences.push({
        sourceType: 'resume_education',
        sourceId: parsedResume.id,
        description: `Studied during ${education.degree?.value || 'degree'} at ${education.institution?.value || 'institution'}`,
        weight: 0.4,
        points: EVIDENCE_POINTS.education,
        observedAt: null,
        verification: 'stated',
        recordedAt
      });
    }

    // 4. Certifications (counted once)
    const certification = (parsedResume.certifications || []).find(cert => containsSkill(cert?.value));
    if (certification) {
      score += EVIDENCE_POINTS.certification;
      evidences.push({
        sourceType: 'resume_certifications',
        sourceId: parsedResume.id,
        description: `Certified: ${certification.value}`,
        weight: 0.9,
        points: EVIDENCE_POINTS.certification,
        observedAt: null,
        verification: 'stated',
        recordedAt
      });
    }

    // 5. Baseline for appearing in the resume at all
    score += EVIDENCE_POINTS.listed;
    evidences.push({
      sourceType: 'resume_skills',
      sourceId: parsedResume.id,
      description: 'Mentioned in the resume',
      weight: 0.2,
      points: EVIDENCE_POINTS.listed,
      observedAt: null,
      verification: 'stated',
      recordedAt
    });

    return { score: Math.min(score, 100), evidences };
  }
}

export default EvidenceCalculator;
