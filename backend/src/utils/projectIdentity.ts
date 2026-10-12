import type { IEvidence } from '../models/UserSkill.js';

/**
 * Recognising the same project recorded in two places, so it earns project points once.
 *
 * The match is deliberately conservative: two projects are the same only when their titles are
 * equal after lower-casing and removing everything that is not a letter or digit, and the result
 * is at least four characters long; or, between portfolio entries, when they give the same link.
 * A project described with different words in the two places is not recognised and is still
 * counted twice. Nothing is ever deleted: the second record stays, credited with zero points.
 */
const MIN_KEY_LENGTH = 4;

/** Comparison key for a project title, or null when the title is too short to compare safely. */
export function projectKey(title: string | null | undefined): string | null {
  const key = (title || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return key.length >= MIN_KEY_LENGTH ? key : null;
}

/** Comparison key for a link: host and path, without scheme, "www.", query, fragment or trailing slash. */
export function linkKey(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, '').toLowerCase()}${parsed.pathname.replace(/\/+$/, '').toLowerCase()}`;
  } catch {
    return null;
  }
}

const RESUME_PROJECT_PREFIX = 'Applied in project: ';

/** The project title behind a piece of project evidence. */
export function projectTitleOf(evidence: Pick<IEvidence, 'sourceType' | 'description' | 'label'>): string | null {
  if (evidence.label) return evidence.label;
  // Records made before titles were stored separately carry the title in the description
  if (evidence.sourceType === 'resume_projects' && evidence.description.startsWith(RESUME_PROJECT_PREFIX)) {
    return evidence.description.slice(RESUME_PROJECT_PREFIX.length);
  }
  return null;
}

/** Keys of the projects that already earn points for one skill. */
export function creditedProjectKeys(evidences: Array<Pick<IEvidence, 'sourceType' | 'description' | 'label' | 'points'>>): Set<string> {
  const keys = new Set<string>();
  for (const evidence of evidences) {
    const counts = evidence.sourceType === 'resume_projects' || (evidence.sourceType === 'portfolio_project' && (evidence.points || 0) > 0);
    if (!counts) continue;
    const key = projectKey(projectTitleOf(evidence));
    if (key) keys.add(key);
  }
  return keys;
}
