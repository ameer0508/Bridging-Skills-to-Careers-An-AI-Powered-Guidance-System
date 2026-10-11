import { canonicalSkillName, extractSkills } from '../../utils/skillLexicon.js';
import { findUserSkill, hasAppliedEvidence, SkillEvidenceMatch } from '../../utils/skillMatching.js';
import { MISSING_REQUIRED_PENALTY, requirementCredit } from '../CareerScoringEngine.js';

export type JobRequirementImportance = 'required' | 'preferred';

export interface JobRequirement {
  skill: string;
  importance: JobRequirementImportance;
}

export type JobMatchStatus =
  | 'SCORED'
  // The posting names no skills we can recognise, so there is nothing to score against
  | 'NO_REQUIREMENTS'
  // The posting has requirements but the candidate has no evidenced skills yet
  | 'NO_CANDIDATE_EVIDENCE';

export interface JobRequirementResult extends JobRequirement {
  status: 'applied' | 'listed' | 'inferred' | 'missing';
  matchedVia?: string;
}

export interface JobMatchResult {
  /** 0-100, or null when no honest score can be calculated (see status). */
  score: number | null;
  status: JobMatchStatus;
  matchedSkills: string[];
  missingSkills: string[];
  requirements: JobRequirementResult[];
  explanation: string;
}

export interface JobRequirementSource {
  /** Skills the provider explicitly lists as required. */
  skills?: string[];
  /** Qualification / requirement bullet points, when the provider supplies them separately. */
  qualifications?: string[];
  description?: string;
}

const REQUIRED_WEIGHT = 2;
const PREFERRED_WEIGHT = 1;

// Phrases that mark a sentence as describing optional rather than mandatory skills
const OPTIONAL_MARKERS =
  /\b(?:nice[\s-]to[\s-]have|good[\s-]to[\s-]have|preferred|preferably|bonus|a plus|is a plus|desirable|desired|optional|advantage|advantageous|ideally|familiarity with|exposure to)\b/i;

/**
 * Derives a posting's skill requirements from what the employer actually wrote.
 * Skills named in the provider's required-skills list or in qualification bullets are required.
 * Skills named in the free-text description are required unless their sentence marks them as
 * optional ("nice to have", "preferred", "a plus"...). Nothing is assumed when no skill is named.
 */
export function extractJobRequirements(source: JobRequirementSource): JobRequirement[] {
  const importance = new Map<string, JobRequirementImportance>();
  const add = (skill: string, level: JobRequirementImportance) => {
    const name = canonicalSkillName(skill);
    if (!name) return;
    // "required" always wins over "preferred" for the same skill
    if (level === 'required' || !importance.has(name)) importance.set(name, level);
  };

  for (const skill of source.skills || []) add(skill, 'required');

  const classify = (text: string, defaultLevel: JobRequirementImportance) => {
    // Sentence/bullet granularity keeps "X required. Y is a plus." correctly separated
    for (const segment of text.split(/(?<=[.!?;])\s+|\r?\n|•/)) {
      if (!segment.trim()) continue;
      const level = OPTIONAL_MARKERS.test(segment) ? 'preferred' : defaultLevel;
      for (const skill of extractSkills(segment)) add(skill, level);
    }
  };

  for (const line of source.qualifications || []) classify(line, 'required');
  if (source.description) classify(source.description, 'required');

  return [...importance.entries()].map(([skill, level]) => ({ skill, importance: level }));
}

const list = (items: string[], max = 4): string =>
  items.length <= max ? items.join(', ') : `${items.slice(0, max).join(', ')} and ${items.length - max} more`;

/**
 * Scores a candidate against a posting's requirements.
 *
 *   score = 100 x sum(points earned) / sum(points possible) x (1 - penalty)
 *   points possible: required skill 2, preferred skill 1
 *   points earned:   possible x (0.5 + 0.5 x evidence/100) for an evidenced skill, else 0
 *   penalty:         30% x (required skills missing / required skills)
 *
 * 0 means none of the named skills appear in the candidate's evidence; 100 means all are
 * covered with the strongest evidence. No score is produced when the posting names no
 * recognisable skills or the candidate has no evidenced skills at all.
 */
export function matchOpportunity(
  requirements: JobRequirement[],
  userSkillIndex: Map<string, SkillEvidenceMatch>
): JobMatchResult {
  if (requirements.length === 0) {
    return {
      score: null,
      status: 'NO_REQUIREMENTS',
      matchedSkills: [],
      missingSkills: [],
      requirements: [],
      explanation:
        'This posting does not name any skills we can recognise, so no match score was calculated. Read the description to judge the fit.'
    };
  }

  if (userSkillIndex.size === 0) {
    return {
      score: null,
      status: 'NO_CANDIDATE_EVIDENCE',
      matchedSkills: [],
      missingSkills: requirements.map(r => r.skill),
      requirements: requirements.map(r => ({ ...r, status: 'missing' as const })),
      explanation:
        'No match score yet: upload a resume so your skills can be compared with this posting\'s requirements.'
    };
  }

  let possible = 0;
  let earned = 0;
  const results: JobRequirementResult[] = [];

  for (const requirement of requirements) {
    const weight = requirement.importance === 'required' ? REQUIRED_WEIGHT : PREFERRED_WEIGHT;
    possible += weight;

    const match = findUserSkill(userSkillIndex, requirement.skill);
    if (!match) {
      results.push({ ...requirement, status: 'missing' });
      continue;
    }

    earned += weight * requirementCredit(match.evidenceScore);
    results.push({
      ...requirement,
      status: match.inferredFrom
        ? 'inferred'
        : hasAppliedEvidence(match.evidences)
          ? 'applied'
          : 'listed',
      matchedVia: match.inferredFrom ? match.canonicalName : undefined
    });
  }

  const required = results.filter(r => r.importance === 'required');
  const preferred = results.filter(r => r.importance === 'preferred');
  const requiredMissing = required.filter(r => r.status === 'missing');
  const penalty =
    required.length > 0 ? MISSING_REQUIRED_PENALTY * (requiredMissing.length / required.length) : 0;
  const score = Math.round((earned / possible) * (1 - penalty) * 100);

  const matched = results.filter(r => r.status !== 'missing');
  const missing = [...requiredMissing, ...preferred.filter(r => r.status === 'missing')];

  const parts: string[] = [];
  if (required.length > 0) {
    const met = required.filter(r => r.status !== 'missing');
    parts.push(
      `Your resume evidences ${met.length} of ${required.length} required skills` +
        (met.length > 0 ? ` (${list(met.map(r => r.skill))})` : '') +
        '.'
    );
  }
  if (preferred.length > 0) {
    const met = preferred.filter(r => r.status !== 'missing');
    parts.push(`${met.length} of ${preferred.length} preferred skills matched.`);
  }
  if (requiredMissing.length > 0) {
    parts.push(`Not found on your resume: ${list(requiredMissing.map(r => r.skill))}.`);
  }
  const inferred = results.filter(r => r.status === 'inferred');
  if (inferred.length > 0) {
    parts.push(
      `Counted indirectly: ${list(inferred.map(r => `${r.skill} (from ${r.matchedVia})`))}.`
    );
  }
  const listedOnly = results.filter(r => r.status === 'listed');
  if (listedOnly.length > 0) {
    parts.push(
      `Listed but not shown in a role or project: ${list(listedOnly.map(r => r.skill))}.`
    );
  }

  return {
    score,
    status: 'SCORED',
    matchedSkills: matched.map(r => r.skill),
    missingSkills: missing.map(r => r.skill),
    requirements: results,
    explanation: parts.join(' ')
  };
}
