/**
 * Test isolation. MUST be the first import of every test entry point, so these values are
 * in place before `config/env.ts` reads the environment (dotenv never overrides set values).
 *
 * Guarantees for a test run:
 *  - no connection to the developer's real database (URI points at a closed port; tests
 *    connect explicitly to a throwaway in-memory MongoDB instead)
 *  - uploads and logs go to a fresh temp directory, never backend/uploads or backend/logs
 *  - no calls to the real AI service or the live jobs API
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';

const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skillbridge-test-'));

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/skillbridge_test_never_used';
process.env.UPLOAD_DIR = path.join(sandboxDir, 'uploads');
process.env.LOG_DIR = path.join(sandboxDir, 'logs');
process.env.AI_SERVICE_URL = 'http://127.0.0.1:9';
process.env.INTERNAL_SERVICE_KEY = 'test-internal-service-key';
process.env.JWT_ACCESS_SECRET = 'test-only-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-only-refresh-secret';
process.env.RAPIDAPI_KEY = '';
process.env.JSEARCH_API_KEY = '';
// The combined suites send more requests from one address than the general production limit
// (1000 per 15 minutes) allows. The sign-in limiter is separate and is tested at its real value.
process.env.API_RATE_LIMIT_MAX = '100000';

export const TEST_SANDBOX_DIR = sandboxDir;

/**
 * Fails fast if the active mongoose connection is anything other than a local throwaway
 * instance created by mongodb-memory-server for this run.
 */
export function assertIsolatedDatabase(expectedUri: string): void {
  const { host, port } = mongoose.connection;
  const expected = new URL(expectedUri);
  if (host !== expected.hostname || String(port) !== expected.port) {
    throw new Error(
      `Refusing to run tests: connected to ${host}:${port}, expected the in-memory test database.`
    );
  }
}
