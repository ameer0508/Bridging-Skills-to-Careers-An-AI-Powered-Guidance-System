import './setupEnv.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BACKEND_PROVIDERS,
  ProviderBlockedError,
  checkLiveCall,
  guardedFetch,
  redactSecrets,
} from '../config/costPolicy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = path.resolve(__dirname, '../../../ai/app/cost_policy/provider_registry.json');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export async function runCostPolicyTests() {
  console.log('🧪 Running Zero-Cost API Policy Tests...');

  // 1. The backend table matches the registry, the source of truth
  const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf-8')) as {
    providers: Record<string, { status: string; credential_env: string[]; enable_env?: string }>;
  };
  for (const [name, entry] of Object.entries(BACKEND_PROVIDERS)) {
    const source = registry.providers[name];
    assert(source, `${name} is missing from provider_registry.json`);
    assert(source.status === entry.status, `${name}: status ${entry.status} differs from registry ${source.status}`);
    assert(
      JSON.stringify(source.credential_env) === JSON.stringify(entry.credentialEnv),
      `${name}: credential variables differ from the registry`
    );
    assert(source.enable_env === entry.enableEnv, `${name}: enable flag differs from the registry`);
  }
  console.log('  ✓ Backend provider table matches provider_registry.json');

  // 2. An unverified provider stays blocked even with a key and its enable flag
  const withKey = { RAPIDAPI_KEY: 'rapid-fake-key', SKILLBRIDGE_ENABLE_JSEARCH: 'true' };
  const jsearch = checkLiveCall('jsearch', withKey);
  assert(!jsearch.allowed && jsearch.reason === 'unverified', 'JSearch must stay blocked while unverified');
  console.log('  ✓ Unverified JSearch is refused even with a key');

  // 3. Unknown providers fail closed
  assert(checkLiveCall('some_paid_api', {}).reason === 'unknown_provider', 'unknown providers must be refused');
  console.log('  ✓ Unknown providers are refused');

  // 4. A refused call never reaches the network
  let fetchCalls = 0;
  const recordingFetch = (async () => {
    fetchCalls += 1;
    return new Response('{}');
  }) as typeof fetch;
  let refused = false;
  try {
    await guardedFetch('jsearch', 'https://jsearch.p.rapidapi.com/search-v2?query=x', undefined, withKey, recordingFetch);
  } catch (err) {
    refused = err instanceof ProviderBlockedError;
  }
  assert(refused && fetchCalls === 0, 'guardedFetch must throw before calling fetch');
  console.log('  ✓ guardedFetch refuses before any request is made');

  // 5. Missing credentials and missing flags fail closed (checked against an approved stand-in)
  BACKEND_PROVIDERS.__approved_test = { status: 'APPROVED', credentialEnv: ['TEST_KEY'], enableEnv: 'TEST_ENABLE' };
  try {
    assert(checkLiveCall('__approved_test', { TEST_KEY: 'k-1234' }).reason === 'not_enabled', 'off by default');
    assert(checkLiveCall('__approved_test', { TEST_ENABLE: 'true' }).reason === 'missing_credentials', 'needs a key');
    assert(checkLiveCall('__approved_test', { TEST_ENABLE: 'true', TEST_KEY: 'k-1234' }).allowed, 'cleared');
  } finally {
    delete BACKEND_PROVIDERS.__approved_test;
  }
  console.log('  ✓ Disabled flags and missing credentials fail closed');

  // 6. Secrets never reach log text
  const redacted = redactSecrets('JSearch failed with key rapid-fake-key', withKey);
  assert(!redacted.includes('rapid-fake-key') && redacted.includes('[REDACTED]'), 'key must be redacted');
  console.log('  ✓ Credential values are redacted');

  console.log('✅ Zero-cost API policy tests passed');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runCostPolicyTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
