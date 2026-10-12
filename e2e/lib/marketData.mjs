// Shared by the market browser tests: imports the synthetic fixture into the e2e backend's
// embedded database with the operator CLI, as an operator would.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(here, '..', '..', 'backend');
const tsxCli = path.join(backendDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');

/** The URI of the embedded database the e2e backend started, as written to its log. */
export function databaseUri(tmpDir) {
  const log = fs.readFileSync(path.join(tmpDir, 'backend.log'), 'utf8');
  // The log is coloured: stop at the first character that cannot be part of host, port or name
  const match = log.match(/Persistent local database active on URI: (mongodb:\/\/[\w.:-]+\/[\w-]*)/);
  if (!match) throw new Error('could not find the database URI in the backend log');
  return match[1];
}

/** Imports the synthetic fixture and returns the import batch the CLI printed. */
export function importFixture(tmpDir, email) {
  const result = spawnSync(
    process.execPath,
    [tsxCli, path.join('src', 'scripts', 'importMarketPostings.ts'), '--synthetic-fixture', '--imported-by', email],
    { cwd: backendDir, env: { ...process.env, MONGODB_URI: databaseUri(tmpDir), NODE_ENV: 'development' }, encoding: 'utf8' }
  );
  if (result.status !== 0) throw new Error(`import failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout.trim().split('\n').pop());
}
