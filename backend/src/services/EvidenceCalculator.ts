import { IParsedResume } from '../models/ParsedResume.js';
import { IEvidence } from '../models/UserSkill.js';

export class EvidenceCalculator {
  /**
   * Calculates the evidence score and generates evidence records for a specific canonical skill
   * by searching through the user's parsed resume data.
   */
  public static calculateForSkill(
    canonicalName: string,
    aliases: string[],
    parsedResume: IParsedResume
  ): { score: number; evidences: IEvidence[] } {
    let score = 0;
    const evidences: IEvidence[] = [];
    const searchTerms = [canonicalName.toLowerCase(), ...aliases.map(a => a.toLowerCase())];

    const containsSkill = (text: string | undefined): boolean => {
      if (!text) return false;
      const lower = text.toLowerCase();
      // Simple substring match for now. Could be improved with word boundaries if needed.
      return searchTerms.some(term => lower.includes(term));
    };

    // 1. Check Experience (Highest Weight)
    if (parsedResume.experience && parsedResume.experience.length > 0) {
      for (const exp of parsedResume.experience) {
        let found = false;

        // Check role and responsibilities
        if (containsSkill(exp.role?.value)) found = true;
        if (exp.responsibilities) {
          for (const resp of exp.responsibilities) {
            if (containsSkill(resp.value)) found = true;
          }
        }

        if (found) {
          score += 40; // 40 points per job role it appears in
          evidences.push({
            sourceType: 'resume_experience',
            sourceId: parsedResume.id,
            description: `Used at ${exp.company?.value || 'Previous Company'} as ${exp.role?.value || 'Employee'}`,
            weight: 0.8
          });
        }
      }
    }

    // 2. Check Projects (High Weight)
    if (parsedResume.projects && parsedResume.projects.length > 0) {
      for (const proj of parsedResume.projects) {
        let found = false;

        if (containsSkill(proj.description?.value)) found = true;
        if (proj.technologies) {
          for (const tech of proj.technologies) {
            if (containsSkill(tech.value)) found = true;
          }
        }

        if (found) {
          score += 25; // 25 points per project
          evidences.push({
            sourceType: 'resume_projects',
            sourceId: parsedResume.id,
            description: `Applied in project: ${proj.name?.value || 'Unnamed Project'}`,
            weight: 0.6
          });
        }
      }
    }

    // 3. Check Education (Medium Weight)
    if (parsedResume.education && parsedResume.education.length > 0) {
      for (const edu of parsedResume.education) {
        if (containsSkill(edu.degree?.value) || containsSkill(edu.branch?.value)) {
          score += 15;
          evidences.push({
            sourceType: 'resume_education',
            sourceId: parsedResume.id,
            description: `Studied during ${edu.degree?.value || 'Degree'} at ${edu.institution?.value || 'Institution'}`,
            weight: 0.4
          });
        }
      }
    }

    // 4. Check Certifications (High Weight)
    if (parsedResume.certifications && parsedResume.certifications.length > 0) {
      for (const cert of parsedResume.certifications) {
        if (containsSkill(cert.value)) {
          score += 30;
          evidences.push({
            sourceType: 'resume_certifications',
            sourceId: parsedResume.id,
            description: `Certified in: ${cert.value}`,
            weight: 0.9
          });
        }
      }
    }

    // 5. Check Explicit Skills Section (Low Weight on its own, but good baseline)
    // If it was extracted into ExtractedSkill, we know it's in the resume.
    // We add a baseline score of 10 for just being listed.
    score += 10;
    evidences.push({
      sourceType: 'resume_skills',
      sourceId: parsedResume.id,
      description: `Listed in resume skills section`,
      weight: 0.2
    });

    // Cap score at 100
    const finalScore = Math.min(score, 100);

    return { score: finalScore, evidences };
  }
}

export default EvidenceCalculator;
