/**
 * Non-destructive compatibility migration for databases created before the data models
 * were repaired (see docs/DATA_COMPATIBILITY.md).
 *
 *   Report only (default, writes nothing):
 *     pnpm --filter backend exec tsx src/scripts/migrateLegacyData.ts
 *   Apply:
 *     pnpm --filter backend exec tsx src/scripts/migrateLegacyData.ts --apply
 *
 * Options:
 *   --uri <uri>   MongoDB URI. Without it the embedded development database under
 *                 data/local_db is opened, so the backend must be stopped first.
 *
 * What it does, per document, only when the old shape is detected:
 *   - converts ids that were stored as strings into ObjectIds (same value, correct type)
 *   - fills fields the new schema needs from their old equivalents (e.g. `url` -> `applicationUrl`)
 * What it never does: delete documents, drop collections or indexes, overwrite a field that
 * already has a value, or remove the old fields. Running it twice changes nothing the second time.
 * Output is counts only; no personal data is printed.
 */
import path from 'path';
import mongoose from 'mongoose';

type Doc = Record<string, unknown> & { _id: mongoose.Types.ObjectId };

export interface MigrationStep {
  collection: string;
  description: string;
  matched: number;
  changed: number;
  skipped: number;
}

const HEX_ID = /^[0-9a-fA-F]{24}$/;

/** Fields that the old loosely typed schemas stored as strings but are ObjectIds now. */
const STRING_ID_FIELDS: Array<[collection: string, field: string]> = [
  ['savedopportunities', 'userId'],
  ['conversations', 'userId'],
  ['interviewsessions', 'userId'],
  ['resumes', 'userId'],
  ['recommendations', 'userId'],
  ['recommendations', 'careerId'],
  ['progressevents', 'userId'],
  ['careerrequirements', 'careerId'],
  ['extractedskills', 'userId'],
  ['extractedskills', 'resumeId']
];

/**
 * Collections that are fully recomputed from a user's skills (on the next resume processing or
 * the first time the page is opened). Old-shaped documents here are reported and left alone.
 */
const DERIVED_COLLECTIONS: Array<[collection: string, requiredField: string]> = [
  ['careermatches', 'careerId'],
  ['careerreadinesses', 'careerId'],
  ['gapanalyses', 'careerId'],
  ['learningroadmaps', 'careerId'],
  ['analyticssnapshots', 'metrics']
];

export async function migrateLegacyData(
  db: mongoose.mongo.Db,
  apply: boolean
): Promise<{ steps: MigrationStep[]; regenerated: Array<{ collection: string; legacyDocuments: number }> }> {
  const steps: MigrationStep[] = [];
  const existing = new Set((await db.listCollections().toArray()).map(c => c.name));

  // 1. String ids -> ObjectIds
  for (const [collection, field] of STRING_ID_FIELDS) {
    if (!existing.has(collection)) continue;
    const step: MigrationStep = {
      collection,
      description: `${field}: string -> ObjectId`,
      matched: 0,
      changed: 0,
      skipped: 0
    };
    const cursor = db.collection<Doc>(collection).find({ [field]: { $type: 'string' } });
    for await (const doc of cursor) {
      step.matched++;
      const value = doc[field] as string;
      if (!HEX_ID.test(value)) {
        step.skipped++; // not an id we can convert; leave exactly as it is
        continue;
      }
      if (apply) {
        try {
          await db
            .collection<Doc>(collection)
            .updateOne({ _id: doc._id, [field]: value }, { $set: { [field]: new mongoose.Types.ObjectId(value) } });
          step.changed++;
        } catch {
          step.skipped++; // e.g. would collide with an existing unique record; keep the original
        }
      }
    }
    if (step.matched > 0) steps.push(step);
  }

  // 2. Saved opportunities: fields the tracker now relies on
  if (existing.has('savedopportunities')) {
    const step: MigrationStep = {
      collection: 'savedopportunities',
      description: 'fill provider / externalId / applicationUrl from legacy fields',
      matched: 0,
      changed: 0,
      skipped: 0
    };
    const cursor = db.collection<Doc>('savedopportunities').find({
      $or: [
        { provider: { $exists: false } },
        { externalId: { $exists: false } },
        { applicationUrl: { $exists: false }, url: { $type: 'string', $ne: '' } }
      ]
    });
    for await (const doc of cursor) {
      step.matched++;
      const set: Record<string, unknown> = {};
      if (doc.provider === undefined) set.provider = 'Legacy';
      if (doc.externalId === undefined) set.externalId = `legacy-${doc._id.toString()}`;
      if (doc.applicationUrl === undefined && typeof doc.url === 'string' && doc.url) {
        set.applicationUrl = doc.url;
      }
      if (apply && Object.keys(set).length > 0) {
        try {
          await db.collection<Doc>('savedopportunities').updateOne({ _id: doc._id }, { $set: set });
          step.changed++;
        } catch {
          step.skipped++;
        }
      }
    }
    if (step.matched > 0) steps.push(step);
  }

  // 3. Chat messages: sender/text -> role/content (old fields are kept)
  if (existing.has('conversationmessages')) {
    const step: MigrationStep = {
      collection: 'conversationmessages',
      description: 'copy sender/text into role/content',
      matched: 0,
      changed: 0,
      skipped: 0
    };
    const cursor = db
      .collection<Doc>('conversationmessages')
      .find({ role: { $exists: false }, sender: { $type: 'string' }, text: { $type: 'string' } });
    for await (const doc of cursor) {
      step.matched++;
      if (apply) {
        const set: Record<string, unknown> = { role: doc.sender, content: doc.text };
        if (typeof doc.conversationId === 'string' && HEX_ID.test(doc.conversationId)) {
          set.conversationId = new mongoose.Types.ObjectId(doc.conversationId);
        }
        await db.collection<Doc>('conversationmessages').updateOne({ _id: doc._id }, { $set: set });
        step.changed++;
      }
    }
    if (step.matched > 0) steps.push(step);
  }

  // 4. Derived data: count only
  const regenerated: Array<{ collection: string; legacyDocuments: number }> = [];
  for (const [collection, requiredField] of DERIVED_COLLECTIONS) {
    if (!existing.has(collection)) continue;
    const legacyDocuments = await db
      .collection(collection)
      .countDocuments({ [requiredField]: { $exists: false } });
    if (legacyDocuments > 0) regenerated.push({ collection, legacyDocuments });
  }

  return { steps, regenerated };
}

const argValue = (flag: string): string | undefined => {
  const index = process.argv.indexOf(flag);
  return index !== -1 ? process.argv[index + 1] : undefined;
};

async function main() {
  const apply = process.argv.includes('--apply');
  let uri = argValue('--uri');
  let embedded: { stop: () => Promise<boolean> } | null = null;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const server = await MongoMemoryServer.create({
      instance: {
        dbPath: path.resolve(process.cwd(), 'data', 'local_db'),
        storageEngine: 'wiredTiger',
        dbName: 'skillbridge'
      }
    });
    embedded = server;
    uri = server.getUri();
  }

  await mongoose.connect(uri, embedded ? { dbName: 'skillbridge' } : {});
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection is not ready.');
    const { steps, regenerated } = await migrateLegacyData(db, apply);

    console.log(apply ? 'Migration applied.' : 'Report only (no changes written). Re-run with --apply to migrate.');
    if (steps.length === 0) console.log('No legacy-shaped records need conversion.');
    else console.table(steps);
    if (regenerated.length > 0) {
      console.log('Old-format derived records (left untouched; recomputed automatically):');
      console.table(regenerated);
    }
  } finally {
    await mongoose.disconnect();
    if (embedded) await embedded.stop();
  }
}

if (process.argv[1]?.includes('migrateLegacyData')) {
  main().catch(err => {
    console.error('Migration failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
