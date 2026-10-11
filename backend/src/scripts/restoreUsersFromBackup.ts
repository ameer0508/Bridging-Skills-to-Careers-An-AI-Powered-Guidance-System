/**
 * Manual, opt-in recovery of accounts from the legacy `data/users_backup.json` mirror.
 *
 * The application no longer writes or reads that file. This script exists only so accounts
 * that are present in an old mirror but missing from the database can be recovered without
 * asking people to re-register.
 *
 *   Dry run (default, writes nothing):
 *     pnpm --filter backend exec tsx src/scripts/restoreUsersFromBackup.ts
 *   Apply:
 *     pnpm --filter backend exec tsx src/scripts/restoreUsersFromBackup.ts --apply
 *
 * Options:
 *   --file <path>   Backup file to read (default: data/users_backup.json)
 *   --uri <uri>     MongoDB URI. Without it the embedded development database under
 *                   data/local_db is opened, so the backend must be stopped first.
 *
 * Safety properties:
 *   - only inserts accounts whose email does not already exist; never updates or deletes
 *   - keeps the original account id when the backup has one, so existing resumes, skills and
 *     roadmaps stay linked
 *   - never prints names, emails or hashes; output is counts only
 *   - the backup file itself is never modified
 */
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

interface BackupEntry {
  id?: string;
  fullName?: string;
  email?: string;
  passwordHash?: string;
  role?: string;
  primaryCareerDomain?: string;
  secondaryCareerDomains?: string[];
  targetRole?: string;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;
  profileCompleted?: boolean;
}

const argValue = (flag: string): string | undefined => {
  const index = process.argv.indexOf(flag);
  return index !== -1 ? process.argv[index + 1] : undefined;
};

export async function restoreUsersFromBackup(entries: BackupEntry[], apply: boolean) {
  const summary = { total: entries.length, alreadyPresent: 0, restorable: 0, restored: 0, skipped: 0 };

  for (const entry of entries) {
    const email = (entry.email || '').toLowerCase().trim();
    // An account without a password hash could never log in; do not create it
    if (!email || !entry.passwordHash) {
      summary.skipped++;
      continue;
    }

    if (await User.exists({ email })) {
      summary.alreadyPresent++;
      continue;
    }

    summary.restorable++;
    if (!apply) continue;

    const originalId =
      entry.id && mongoose.Types.ObjectId.isValid(entry.id)
        ? new mongoose.Types.ObjectId(entry.id)
        : undefined;
    const idIsFree = originalId ? !(await User.exists({ _id: originalId })) : false;

    await User.create({
      ...(originalId && idIsFree ? { _id: originalId } : {}),
      fullName: entry.fullName || 'User',
      email,
      passwordHash: entry.passwordHash,
      role: entry.role || 'user',
      primaryCareerDomain: entry.primaryCareerDomain || '',
      secondaryCareerDomains: entry.secondaryCareerDomains || [],
      targetRole: entry.targetRole || '',
      onboardingCompleted: Boolean(entry.onboardingCompleted),
      onboardingCompletedAt: entry.onboardingCompletedAt
        ? new Date(entry.onboardingCompletedAt)
        : undefined,
      profileCompleted: Boolean(entry.profileCompleted)
    });
    summary.restored++;
  }

  return summary;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const filePath = path.resolve(process.cwd(), argValue('--file') || 'data/users_backup.json');
  if (!fs.existsSync(filePath)) {
    console.log(`No backup file at ${filePath}; nothing to do.`);
    return;
  }

  const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!Array.isArray(parsed)) throw new Error('Backup file is not a JSON array.');

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

  await mongoose.connect(uri);
  try {
    const summary = await restoreUsersFromBackup(parsed as BackupEntry[], apply);
    console.log(apply ? 'Restore applied.' : 'Dry run (no changes written). Re-run with --apply to restore.');
    console.log(summary);
  } finally {
    await mongoose.disconnect();
    if (embedded) await embedded.stop();
  }
}

if (process.argv[1]?.includes('restoreUsersFromBackup')) {
  main().catch(err => {
    console.error('Restore failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
