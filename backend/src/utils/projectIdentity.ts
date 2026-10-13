import type { IEvidence } from '../models/UserSkill.js';

/**
 * Recognising the same project recorded in two places, so it earns project points once.
 *
 * The match is deliberately conservative. Two projects are the same only when:
 *  - their titles are equal after lower-casing and removing everything that is not a letter or
 *    digit, and the result is at least four characters long; or
 *  - their links identify the same repository or page (repoKey/linkKey): between portfolio
 *    entries, or between an entry and a link written in a resume project.
 * Titles are never compared loosely and no model is asked. A project described with different
 * words and different links is not recognised and is still counted twice. Nothing is ever
 * deleted: the second record stays, credited with zero points, and says why.
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

const CODE_HOSTS = new Set(['github.com', 'gitlab.com', 'bitbucket.org']);

/**
 * The repository a link identifies, however it is written: the repository page, a branch or file
 * view, a ".git" clone URL, or the project's GitHub Pages site. A link into a sub-folder keeps that
 * sub-folder, so two projects kept in one repository (a monorepo) are never treated as one.
 * Null for links that are not to a code host.
 */
export function repoKey(url: string | null | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(/^[a-z]+:\/\//i.test(url) ? url : `https://${url}`);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
  const parts = parsed.pathname.split('/').filter(Boolean).map(p => decodeURIComponent(p).toLowerCase());
  const pages = host.match(/^([a-z0-9-]+)\.github\.io$/);
  if (pages) {
    // owner.github.io/repo is the site of github.com/owner/repo; the bare site is the owner.github.io repository
    return `github.com/${pages[1]}/${parts[0] ?? `${pages[1]}.github.io`}`;
  }
  if (!CODE_HOSTS.has(host) || parts.length < 2) return null;
  const [owner, rawRepo, view, , ...sub] = parts;
  const repo = rawRepo.replace(/\.git$/, '');
  // /tree/<branch>/<folder> and /blob/<branch>/<folder>/file: keep the folder, not the branch or file
  const folderParts = view === 'tree' ? sub : view === 'blob' || view === 'src' ? sub.slice(0, -1) : [];
  const folder = folderParts.length ? `/${folderParts.join('/')}` : '';
  return `${host}/${owner}/${repo}${folder}`;
}

/** The identity used to compare two project links: the repository when known, else host and path. */
export function linkIdentity(url: string | null | undefined): string | null {
  return repoKey(url) ?? linkKey(url);
}

const LINK_IN_TEXT = /\bhttps?:\/\/[^\s)<>"']+|\b(?:github\.com|gitlab\.com|bitbucket\.org)\/[^\s)<>"']+|\b[a-z0-9-]+\.github\.io(?:\/[^\s)<>"']*)?/gi;

/** Identities of the links written in a piece of text (for example a resume project's description). */
export function linkIdentitiesIn(text: string | null | undefined): string[] {
  const found = new Set<string>();
  for (const raw of (text || '').match(LINK_IN_TEXT) || []) {
    const cleaned = raw.replace(/[.,;:]+$/, '');
    const identity = linkIdentity(/^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`);
    if (identity) found.add(identity);
  }
  return [...found];
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
