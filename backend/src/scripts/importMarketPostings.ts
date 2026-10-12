/**
 * Operator import of market postings from a registered source (docs/MARKET_INTELLIGENCE.md).
 *
 *   tsx src/scripts/importMarketPostings.ts --file postings.json --imported-by ops@example.com
 *   tsx src/scripts/importMarketPostings.ts --synthetic-fixture --imported-by ops@example.com
 *
 * The file holds { sourceId, retrievedAt, postings: [...] }, the same body as
 * POST /api/v1/market/imports. Connects to MONGODB_URI. Only registered sources are accepted, and
 * the synthetic fixture is always stored as test data, never as real market records.
 */
import fs from 'fs';
import mongoose from 'mongoose';
import env from '../config/env.js';
import User from '../models/User.js';
import MarketIngestionService, { importRequestSchema } from '../services/market/MarketIngestionService.js';
import { buildSyntheticMarketFixture } from '../seed/marketFixture.js';

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

/** The fixture ends with the last finished month, so no posting is dated after it was retrieved. */
function lastCompleteMonth(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
}

async function main() {
  const email = argument('--imported-by');
  const file = argument('--file');
  const fixture = process.argv.includes('--synthetic-fixture');
  if (!email || (!file && !fixture) || (file && fixture)) {
    throw new Error('Usage: --imported-by <email> and exactly one of --file <path> or --synthetic-fixture');
  }

  const body = fixture
    ? buildSyntheticMarketFixture({ endMonth: argument('--end-month') ?? lastCompleteMonth() })
    : JSON.parse(fs.readFileSync(file as string, 'utf-8'));
  const request = importRequestSchema.parse(body);

  await mongoose.connect(process.env.MONGODB_URI || env.MONGODB_URI);
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new Error(`No account with e-mail ${email}`);
    const batch = await MarketIngestionService.importBatch(request, user._id.toString());
    console.log(JSON.stringify({ batchId: batch._id.toString(), sourceId: batch.sourceId, dataset: batch.dataset, counts: batch.counts }));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
