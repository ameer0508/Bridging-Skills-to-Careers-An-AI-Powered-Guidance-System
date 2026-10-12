import crypto from 'node:crypto';
import { CAREER_TAXONOMY } from '../seed/careerTaxonomy.js';

/**
 * Identifies the scoring rules in force (docs/SCORING.md). Change it whenever a formula,
 * weight or threshold changes, so stored results can be told apart from newer ones.
 */
export const SCORING_VERSION = '2026.10-1';

let cachedTaxonomyVersion: string | null = null;

/** Short hash of the career taxonomy seed: changes whenever a career or requirement changes. */
export function taxonomyVersion(): string {
  if (!cachedTaxonomyVersion) {
    cachedTaxonomyVersion = crypto.createHash('sha256').update(JSON.stringify(CAREER_TAXONOMY)).digest('hex').slice(0, 12);
  }
  return cachedTaxonomyVersion;
}
