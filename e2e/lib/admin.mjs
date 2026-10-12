// Makes an account an administrator in the e2e backend's embedded database. There is no API for
// this on purpose; operators change the role directly in the database, as this does.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { databaseUri } from './marketData.mjs';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'backend');

const SCRIPT = `
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI);
const r = await mongoose.connection.collection('users').updateOne({ email: process.env.ADMIN_EMAIL }, { $set: { role: process.env.ADMIN_ROLE } });
await mongoose.disconnect();
if (r.matchedCount !== 1) { console.error('no such user'); process.exit(1); }
`;

export function setRole(tmpDir, email, role) {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', SCRIPT], {
    cwd: backendDir,
    env: { ...process.env, MONGODB_URI: databaseUri(tmpDir), ADMIN_EMAIL: email.toLowerCase(), ADMIN_ROLE: role },
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`could not set the role: ${result.stderr || result.stdout}`);
}
