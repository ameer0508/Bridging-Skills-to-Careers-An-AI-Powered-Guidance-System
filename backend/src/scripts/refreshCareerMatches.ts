/**
 * Recomputes career matches, readiness and recommendations for every user whose stored results
 * predate the current career taxonomy (for example after E1 added six careers). The backend does
 * this itself shortly after start (TaxonomyRefreshService); this script runs it on demand.
 *
 *   tsx src/scripts/refreshCareerMatches.ts            # recompute
 *   tsx src/scripts/refreshCareerMatches.ts --dry-run  # only count who would be recomputed
 *
 * Connects to MONGODB_URI. Only derived records change; skill evidence is never touched.
 * Exit code 2 means at least one user's recalculation failed (it is recorded and can be re-run).
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import CareerService from '../services/CareerService.js';
import { refreshUsersForTaxonomy } from '../services/careers/TaxonomyRefreshService.js';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  try {
    const dryRun = process.argv.includes('--dry-run');
    // New careers must exist before anyone can be matched against them
    if (!dryRun) await CareerService.seedInitialTaxonomy();
    const result = await refreshUsersForTaxonomy({ dryRun });
    console.log(JSON.stringify({ ...result, at: new Date().toISOString() }));
    if (result.failed > 0) process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
