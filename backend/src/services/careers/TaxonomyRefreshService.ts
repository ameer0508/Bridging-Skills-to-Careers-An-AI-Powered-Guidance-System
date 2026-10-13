import mongoose from 'mongoose';
import UserSkill from '../../models/UserSkill.js';
import RecalculationRun from '../../models/RecalculationRun.js';
import RecalculationService from '../RecalculationService.js';
import { taxonomyVersion } from '../../utils/versions.js';
import logger from '../../config/logger.js';

/**
 * When the career taxonomy changes (E1 added six careers), users' stored matches, readiness and
 * recommendations were computed against the old list. This recomputes each affected user once,
 * through the ordinary recalculation (trigger `taxonomy_changed`), so new careers appear without
 * the user having to change their resume.
 *
 * - Affected: users with skill evidence whose last completed match recalculation used another
 *   taxonomy version (or who have none). Users without evidence have nothing to match.
 * - Non-destructive: only derived records are rebuilt. Skill evidence, resumes, portfolios,
 *   plans and progress are not touched. Each run is a RecalculationRun with before and after
 *   figures, shown in the Career Lab activity as "Career data updated".
 * - Idempotent: once a user's last run carries the current version they are skipped, and the
 *   recalculation itself skips a run whose inputs have not changed.
 */
export interface TaxonomyRefreshResult {
  taxonomyVersion: string;
  usersWithEvidence: number;
  upToDate: number;
  /** Recomputed. */
  refreshed: number;
  /** Recalculation found the same inputs as its last run, so nothing needed recomputing. */
  unchanged: number;
  failed: number;
  dryRun: boolean;
}

export async function staleUserIds(): Promise<{ stale: mongoose.Types.ObjectId[]; usersWithEvidence: number }> {
  const version = taxonomyVersion();
  const userIds = (await UserSkill.distinct('userId')) as mongoose.Types.ObjectId[];
  const stale: mongoose.Types.ObjectId[] = [];
  for (const userId of userIds) {
    const last = await RecalculationRun.findOne({ userId, status: 'completed', modulesRecomputed: 'matches' })
      .sort({ createdAt: -1, _id: -1 })
      .select('taxonomyVersion')
      .lean();
    if (last?.taxonomyVersion !== version) stale.push(userId);
  }
  return { stale, usersWithEvidence: userIds.length };
}

export async function refreshUsersForTaxonomy(options: { dryRun?: boolean } = {}): Promise<TaxonomyRefreshResult> {
  const version = taxonomyVersion();
  const { stale, usersWithEvidence } = await staleUserIds();
  const result: TaxonomyRefreshResult = { taxonomyVersion: version, usersWithEvidence, upToDate: usersWithEvidence - stale.length, refreshed: 0, unchanged: 0, failed: 0, dryRun: Boolean(options.dryRun) };
  if (options.dryRun) return result;
  // One user at a time: this runs in the background and must not starve request handling
  for (const userId of stale) {
    const run = await RecalculationService.run(String(userId), 'taxonomy_changed', version);
    if (run.status === 'failed') result.failed++;
    else if (run.status === 'skipped_duplicate') result.unchanged++;
    else result.refreshed++;
  }
  return result;
}

/** Soon after start, in the background, unless TAXONOMY_REFRESH_ON_START=false. */
export const TAXONOMY_REFRESH_DELAY_MS = 10_000;

export function scheduleTaxonomyRefreshOnStart(): void {
  if ((process.env.TAXONOMY_REFRESH_ON_START || '').toLowerCase() === 'false') {
    logger.info('Taxonomy refresh on start is disabled (TAXONOMY_REFRESH_ON_START=false).');
    return;
  }
  const timer = setTimeout(() => {
    refreshUsersForTaxonomy()
      .then(r => {
        if (r.refreshed || r.failed) logger.info(`Taxonomy refresh: ${JSON.stringify(r)}`);
      })
      .catch(error => logger.error(`Taxonomy refresh failed: ${error instanceof Error ? error.message : String(error)}`));
  }, TAXONOMY_REFRESH_DELAY_MS);
  timer.unref();
}
