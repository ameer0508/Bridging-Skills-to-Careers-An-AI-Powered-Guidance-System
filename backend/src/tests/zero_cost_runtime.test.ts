import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import env from '../config/env.js';
import JSearchProvider from '../services/opportunities/JSearchProvider.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * Zero-cost enforcement on the backend's real outbound path: with live job-search keys present,
 * the JSearch provider and GET /opportunities never call fetch, report BLOCKED_BY_POLICY instead
 * of UP, and serve only the labelled demo listings.
 */
export async function runZeroCostRuntimeTests() {
  console.log('🧪 Running Zero-Cost Runtime Enforcement Tests...');

  const mutableEnv = env as unknown as Record<string, string>;
  const saved = { RAPIDAPI_KEY: mutableEnv.RAPIDAPI_KEY, JSEARCH_API_KEY: mutableEnv.JSEARCH_API_KEY };
  const savedFlag = process.env.SKILLBRIDGE_ENABLE_JSEARCH;
  const realFetch = globalThis.fetch;
  const outbound: string[] = [];

  mutableEnv.RAPIDAPI_KEY = 'rapid-test-key-not-real';
  mutableEnv.JSEARCH_API_KEY = 'jsearch-test-key-not-real';
  // Even an operator switching it on does not clear an unverified provider
  process.env.SKILLBRIDGE_ENABLE_JSEARCH = 'true';
  // Record any request leaving for a non-local host; local test traffic passes through
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const url = String(input instanceof Request ? input.url : input);
    if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) {
      outbound.push(url);
      throw new Error(`blocked outbound request to ${url}`);
    }
    return realFetch(input, init);
  }) as typeof fetch;

  const h = await startHttpHarness();
  try {
    const provider = new JSearchProvider();
    const health = await provider.healthCheck();
    assert.equal(health.status, 'BLOCKED_BY_POLICY', 'a key alone must not report the provider as UP');
    assert.match(health.message ?? '', /zero-cost policy \(unverified\)/);
    assert.ok(!(health.message ?? '').includes('rapid-test-key-not-real'), 'the key is never echoed');

    const listings = await provider.search({ keywords: 'Python' });
    assert.ok(listings.length > 0 && listings.every(o => o.isSample), 'only labelled demo listings are returned');
    console.log('  ✓ Provider: BLOCKED_BY_POLICY with keys set; demo listings only, each marked as a sample');

    const user = await h.registerUser('zero-cost');
    const res = await h.api('GET', '/opportunities?search=Python', { token: user.token });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.providerHealth.status, 'BLOCKED_BY_POLICY');
    assert.equal(res.body.data.meta.source, 'sample', 'the search is reported as demo, not live');
    assert.ok(!JSON.stringify(res.body).includes('rapid-test-key-not-real'));
    console.log('  ✓ GET /opportunities: reported as sample data with the policy status; no key in the response');

    assert.deepEqual(outbound, [], 'no request left for an external host');
    console.log('  ✓ No outbound request was attempted');
    console.log('✅ Zero-Cost Runtime Enforcement Tests Passed\n');
  } finally {
    await h.close();
    globalThis.fetch = realFetch;
    Object.assign(mutableEnv, saved);
    if (savedFlag === undefined) delete process.env.SKILLBRIDGE_ENABLE_JSEARCH;
    else process.env.SKILLBRIDGE_ENABLE_JSEARCH = savedFlag;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runZeroCostRuntimeTests();
    } catch (err) {
      console.error('❌ Zero-Cost Runtime Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
