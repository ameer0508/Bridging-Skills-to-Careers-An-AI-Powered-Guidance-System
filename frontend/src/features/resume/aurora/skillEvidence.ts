/** One piece of evidence behind a skill, as GET /skills/me returns it (backend/src/models/UserSkill.ts). */
export interface SkillEvidence {
  sourceType: string;
  description: string;
  points?: number;
  verification?: 'stated' | 'self_attested' | 'assessed';
  label?: string;
  duplicateOf?: string;
  observedAt?: string | null;
  ongoing?: boolean;
}

export interface ProfileSkill {
  id?: string;
  name: string;
  category?: string;
  evidenceScore?: number;
  evidences?: SkillEvidence[];
}

/**
 * How strongly a skill is shown, from its strongest evidence:
 * assessed in SkillBridge > applied in work or projects > studied or certified > confirmed by you > only listed.
 */
export type EvidenceKind = 'assessed' | 'applied' | 'studied' | 'self' | 'listed';

export const EVIDENCE_KINDS: Array<{ id: EvidenceKind; title: string; blurb: string }> = [
  { id: 'assessed', title: 'Assessed', blurb: 'Shown in a skill check you took in SkillBridge.' },
  { id: 'applied', title: 'Applied', blurb: 'Used in a job or a project described in your resume or portfolio.' },
  { id: 'studied', title: 'Studied or certified', blurb: 'Named in your education or a certification.' },
  { id: 'self', title: 'Confirmed by you', blurb: 'You added or confirmed it yourself; not checked.' },
  { id: 'listed', title: 'Listed only', blurb: 'Mentioned in the resume, with no role or project showing its use.' },
];

export const kindOf = (skill: ProfileSkill): EvidenceKind => {
  const ev = skill.evidences ?? [];
  if (ev.some(e => e.verification === 'assessed' || e.sourceType === 'assessment')) return 'assessed';
  if (ev.some(e => !e.duplicateOf && ['resume_experience', 'resume_projects', 'portfolio_project'].includes(e.sourceType))) return 'applied';
  if (ev.some(e => e.sourceType === 'resume_education' || e.sourceType === 'resume_certifications')) return 'studied';
  if (ev.some(e => e.sourceType === 'self_attested' || e.verification === 'self_attested')) return 'self';
  return 'listed';
};

export const SOURCE_LABEL: Record<string, string> = {
  resume_experience: 'Work experience',
  resume_projects: 'Resume project',
  resume_education: 'Education',
  resume_certifications: 'Certification',
  resume_skills: 'Skills list',
  self_attested: 'Your statement',
  assessment: 'Skill check',
  portfolio_project: 'Portfolio',
};
