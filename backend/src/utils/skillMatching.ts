import { IUserSkill, IEvidence } from '../models/UserSkill.js';
import { ISkill } from '../models/Skill.js';
import { escapeRegExp, impliedSkills, lookupSkill } from './skillLexicon.js';

export { escapeRegExp };

/**
 * A skill demonstrated only indirectly (e.g. SQL through PostgreSQL) counts for less than
 * the same evidence for the skill itself.
 */
export const INFERENCE_DISCOUNT = 0.7;

/** How a requirement was satisfied by the candidate's evidence. */
export interface SkillEvidenceMatch {
  userSkill: IUserSkill;
  /** Canonical name of the candidate's skill that satisfied the requirement. */
  canonicalName: string;
  /** Evidence score that applies to this requirement (already discounted when inferred). */
  evidenceScore: number;
  evidences: IEvidence[];
  /** Set when the requirement is met indirectly, naming the skill it was inferred from. */
  inferredFrom?: string;
}

/**
 * Returns every lookup key a skill name can be matched under.
 * "Amazon Web Services (AWS)" -> ["amazon web services (aws)", "amazon web services", "aws"]
 * "React.js" -> ["react.js", "react"]
 * Lexicon aliases resolve to their canonical name as well: "postgres" -> also "postgresql".
 */
export const skillKeys = (name: string): string[] => {
  const base = (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
  if (!base) return [];

  const keys = new Set<string>([base]);

  const parenthetical = base.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parenthetical) {
    keys.add(parenthetical[1].trim());
    keys.add(parenthetical[2].trim());
  }

  for (const key of [...keys]) {
    // "react.js" / "reactjs" -> "react"; keeps short names such as "js" or "d3.js" intact
    const withoutJs = key.replace(/\.?js$/, '');
    if (withoutJs.length >= 3 && withoutJs !== key) keys.add(withoutJs);
  }

  const known = lookupSkill(name);
  if (known) keys.add(known.name.toLowerCase());

  keys.delete('');
  return [...keys];
};

/**
 * Indexes a user's populated skills by every key they can be matched under, including the
 * skills they imply. Where several entries share a key the strongest evidence wins.
 */
export const buildUserSkillIndex = (userSkills: IUserSkill[]): Map<string, SkillEvidenceMatch> => {
  const index = new Map<string, SkillEvidenceMatch>();

  const offer = (key: string, candidate: SkillEvidenceMatch) => {
    const existing = index.get(key);
    const better =
      !existing ||
      candidate.evidenceScore > existing.evidenceScore ||
      // On a tie, direct evidence is preferred over an inference
      (candidate.evidenceScore === existing.evidenceScore && existing.inferredFrom && !candidate.inferredFrom);
    if (better) index.set(key, candidate);
  };

  for (const userSkill of userSkills) {
    const skill = userSkill.skillId as unknown as ISkill | null;
    if (!skill || !skill.canonicalName) continue;

    const direct: SkillEvidenceMatch = {
      userSkill,
      canonicalName: skill.canonicalName,
      evidenceScore: userSkill.evidenceScore,
      evidences: userSkill.evidences || []
    };
    for (const name of [skill.canonicalName, ...(skill.aliases || [])]) {
      for (const key of skillKeys(name)) offer(key, direct);
    }

    for (const implied of impliedSkills(skill.canonicalName)) {
      const inferred: SkillEvidenceMatch = {
        ...direct,
        evidenceScore: Math.round(userSkill.evidenceScore * INFERENCE_DISCOUNT),
        inferredFrom: skill.canonicalName
      };
      for (const key of skillKeys(implied)) offer(key, inferred);
    }
  }
  return index;
};

/** Finds the candidate evidence that satisfies a named requirement, if any. */
export const findUserSkill = (
  index: Map<string, SkillEvidenceMatch>,
  requiredSkillName: string
): SkillEvidenceMatch | undefined => {
  let best: SkillEvidenceMatch | undefined;
  for (const key of skillKeys(requiredSkillName)) {
    const match = index.get(key);
    if (match && (!best || match.evidenceScore > best.evidenceScore)) best = match;
  }
  return best;
};

/** True when the evidence shows the skill being used, not merely listed. */
export const hasAppliedEvidence = (evidences: IEvidence[]): boolean =>
  evidences.some(e =>
    ['resume_experience', 'resume_projects', 'resume_certifications'].includes(e.sourceType) ||
    // A portfolio project counts as use only when it earned points, that is, when it has a link
    (e.sourceType === 'portfolio_project' && (e.points || 0) > 0)
  );
