import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { migrateLegacyData } from '../scripts/migrateLegacyData.js';
import { restoreUsersFromBackup } from '../scripts/restoreUsersFromBackup.js';
import { SavedOpportunity } from '../models/SavedOpportunity.js';
import { Conversation } from '../models/Conversation.js';
import { ConversationMessage } from '../models/ConversationMessage.js';
import { User } from '../models/User.js';

/**
 * Verifies the legacy-data tooling against documents written in the OLD shapes
 * (inserted through the raw driver, bypassing today's schemas).
 */
export async function runLegacyMigrationTests() {
  console.log('🧪 Running Legacy Data Compatibility Tests...');
  const db = mongoose.connection.db;
  assert.ok(db, 'database connection required');

  const userId = new mongoose.Types.ObjectId();
  const conversationId = new mongoose.Types.ObjectId();

  // Old shapes: user ids stored as strings, different field names, missing fields
  await db.collection('savedopportunities').insertMany([
    {
      userId: userId.toString(),
      externalId: 'legacy-job-1',
      title: 'Old Saved Job',
      company: 'Old Co',
      url: 'https://example.com/old-job',
      status: 'applied'
    },
    { userId: 'not-an-object-id', externalId: 'legacy-job-2', title: 'Odd Record', company: 'Odd Co', status: 'saved' }
  ]);
  await db.collection('conversations').insertOne({
    _id: conversationId,
    userId: userId.toString(),
    title: 'Old chat'
  });
  await db.collection('conversationmessages').insertOne({
    conversationId: conversationId.toString(),
    sender: 'user',
    text: 'Hello from the old schema'
  });
  await db.collection('careermatches').insertOne({ userId: userId.toString(), targetRole: 'Old Role', matchScore: 70 });

  const countsBefore = {
    saved: await db.collection('savedopportunities').countDocuments(),
    conversations: await db.collection('conversations').countDocuments(),
    messages: await db.collection('conversationmessages').countDocuments(),
    matches: await db.collection('careermatches').countDocuments()
  };

  // Before migration the typed models cannot see the old records
  assert.equal(await SavedOpportunity.countDocuments({ userId }), 0);
  assert.equal(await Conversation.countDocuments({ userId }), 0);

  // --- Dry run writes nothing ----------------------------------------------
  const report = await migrateLegacyData(db, false);
  assert.ok(report.steps.some(s => s.collection === 'savedopportunities' && s.matched >= 1));
  assert.ok(report.steps.every(s => s.changed === 0), 'dry run must not change anything');
  assert.equal(await SavedOpportunity.countDocuments({ userId }), 0, 'dry run left data as it was');
  assert.deepEqual(report.regenerated, [{ collection: 'careermatches', legacyDocuments: 1 }]);
  console.log('  ✓ Report-only run detects legacy records and changes nothing');

  // --- Apply ----------------------------------------------------------------
  await migrateLegacyData(db, true);

  const saved = await SavedOpportunity.findOne({ userId, externalId: 'legacy-job-1' });
  assert.ok(saved, 'saved job becomes visible to its owner');
  assert.equal(saved!.status, 'applied', 'existing values are preserved');
  assert.equal(saved!.applicationUrl, 'https://example.com/old-job', 'apply link recovered from the old field');
  assert.equal(saved!.provider, 'Legacy');

  const rawSaved = await db.collection('savedopportunities').findOne({ externalId: 'legacy-job-1' });
  assert.equal(rawSaved!.url, 'https://example.com/old-job', 'old field is kept, not removed');

  const odd = await db.collection('savedopportunities').findOne({ externalId: 'legacy-job-2' });
  assert.equal(odd!.userId, 'not-an-object-id', 'unconvertible values are left untouched');

  assert.equal(await Conversation.countDocuments({ userId }), 1, 'conversation visible to its owner');
  const message = await ConversationMessage.findOne({ conversationId });
  assert.equal(message?.role, 'user');
  assert.equal(message?.content, 'Hello from the old schema');

  // Nothing was deleted anywhere
  assert.deepEqual(
    {
      saved: await db.collection('savedopportunities').countDocuments(),
      conversations: await db.collection('conversations').countDocuments(),
      messages: await db.collection('conversationmessages').countDocuments(),
      matches: await db.collection('careermatches').countDocuments()
    },
    countsBefore,
    'migration never deletes documents'
  );
  console.log('  ✓ Apply converts ids and fields, keeps old fields, deletes nothing');

  // --- Idempotent -----------------------------------------------------------
  const second = await migrateLegacyData(db, true);
  assert.ok(second.steps.every(s => s.changed === 0), 'second run has nothing left to change');
  console.log('  ✓ Second run is a no-op');

  // --- Account restore from an old backup mirror -----------------------------
  const originalId = new mongoose.Types.ObjectId();
  const existing = await User.create({ email: 'present@example.com', passwordHash: 'hash-current' });
  const entries = [
    { id: originalId.toString(), email: 'Missing@Example.com', passwordHash: 'hash-old', fullName: 'Missing User' },
    { id: new mongoose.Types.ObjectId().toString(), email: 'present@example.com', passwordHash: 'hash-from-backup' },
    { email: 'nohash@example.com' }
  ];

  const dryRestore = await restoreUsersFromBackup(entries, false);
  assert.deepEqual(dryRestore, { total: 3, alreadyPresent: 1, restorable: 1, restored: 0, skipped: 1 });
  assert.equal(await User.countDocuments({ email: 'missing@example.com' }), 0, 'dry run creates no accounts');

  const applied = await restoreUsersFromBackup(entries, true);
  assert.equal(applied.restored, 1);
  const restored = await User.findOne({ email: 'missing@example.com' }).select('+passwordHash');
  assert.equal(restored?._id.toString(), originalId.toString(), 'original account id is kept so data stays linked');
  assert.equal(restored?.passwordHash, 'hash-old');
  const untouched = await User.findById(existing._id).select('+passwordHash');
  assert.equal(untouched?.passwordHash, 'hash-current', 'existing accounts are never overwritten');
  assert.equal((await restoreUsersFromBackup(entries, true)).restored, 0, 'restore is idempotent');
  console.log('  ✓ Account restore: dry run, original ids kept, existing accounts never overwritten');

  console.log('✅ Legacy Data Compatibility Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runLegacyMigrationTests();
    } catch (err) {
      console.error('❌ Legacy Data Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
