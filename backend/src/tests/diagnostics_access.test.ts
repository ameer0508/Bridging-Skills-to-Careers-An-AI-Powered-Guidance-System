import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import env from '../config/env.js';
import { User } from '../models/User.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * Infrastructure diagnostics (uptime, memory, database host, global record counts) are not
 * public. The health check stays public and says only whether the service is up.
 */
export async function runDiagnosticsAccessTests() {
  console.log('🧪 Running Diagnostics Access Tests (HTTP)...');
  const h = await startHttpHarness();
  const envRecord = env as unknown as { NODE_ENV: string };
  const originalEnv = envRecord.NODE_ENV;
  const get = async (path: string, token?: string) => {
    const res = await fetch(`${h.origin}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const text = await res.text();
    let body: any = text;
    try {
      body = JSON.parse(text);
    } catch {
      // HTML
    }
    return { status: res.status, body, text };
  };

  try {
    assert.notEqual(envRecord.NODE_ENV, 'development', 'tests run with diagnostics restricted');
    const user = await h.registerUser('regular');
    const admin = await h.registerUser('operator');

    // --- Restricted outside local development ----------------------------------------------
    const anonymous = await get('/api/v1/realtime');
    assert.equal(anonymous.status, 401);
    assert.equal(anonymous.body.error.code, 'UNAUTHORIZED');
    assert.equal((await get('/api/v1/realtime', 'not-a-token')).status, 401);

    const regular = await get('/api/v1/realtime', user.token);
    assert.equal(regular.status, 403, 'a signed-in user who is not an administrator is refused');
    assert.equal(regular.body.error.code, 'FORBIDDEN');
    for (const leaked of ['memory_rss_mb', 'careers_count', 'node_version', 'uptime_seconds', 'host']) {
      assert.ok(!anonymous.text.includes(leaked) && !regular.text.includes(leaked), `${leaked} leaked in a refusal`);
    }
    console.log('  ✓ /api/v1/realtime: 401 without a token, 403 for an ordinary user, nothing leaked in either');

    // --- Nobody can make themselves an administrator through the API --------------------------
    assert.equal((await h.api('PUT', '/users/me', { token: admin.token, json: { role: 'admin' } })).status, 400);
    assert.equal((await User.findById(admin.userId))?.role, 'user');
    assert.equal((await get('/api/v1/realtime', admin.token)).status, 403);

    // --- An administrator (role set directly in the database) is allowed -----------------------
    await User.updateOne({ _id: admin.userId }, { $set: { role: 'admin' } });
    const allowed = await get('/api/v1/realtime', admin.token);
    assert.equal(allowed.status, 200);
    assert.equal(typeof allowed.body.system.memory_rss_mb, 'number');
    assert.equal(typeof allowed.body.database.careers_count, 'number');

    // The role is read on every request: a demoted account loses access with the same token
    await User.updateOne({ _id: admin.userId }, { $set: { role: 'user' } });
    assert.equal((await get('/api/v1/realtime', admin.token)).status, 403);
    console.log('  ✓ Administrators are allowed; the role cannot be self-assigned and is re-checked on every request');

    // --- Public endpoints say nothing about the system ---------------------------------------------
    const health = await get('/health');
    assert.equal(health.status, 200);
    assert.deepEqual(Object.keys(health.body).sort(), ['services', 'status', 'timestamp']);
    assert.deepEqual(health.body.services, { database: 'UP' });

    const root = await get('/');
    assert.equal(root.status, 200);
    assert.deepEqual(root.body, { success: true, service: 'SkillBridge API', health: '/health' });
    const apiRoot = await get('/api/v1');
    assert.equal(apiRoot.status, 200);
    assert.ok(!JSON.stringify(apiRoot.body).includes('realtime'), 'the public API index does not advertise the diagnostics endpoint');
    for (const page of [health, root, apiRoot]) {
      assert.ok(!/memory|heap|node_version|_count|uptime|mongodb:\/\//i.test(page.text), 'a public endpoint exposes system details');
    }
    console.log('  ✓ Public /health, / and /api/v1 expose no memory, version, uptime, host or record counts');

    // --- Local development keeps the developer status page working ---------------------------------
    envRecord.NODE_ENV = 'development';
    const devRealtime = await get('/api/v1/realtime');
    assert.equal(devRealtime.status, 200, 'open on a developer machine, where the status page polls it');
    const devRoot = await fetch(`${h.origin}/`, { headers: { Accept: 'text/html' } });
    assert.match(devRoot.headers.get('content-type') || '', /text\/html/);
    envRecord.NODE_ENV = 'production';
    assert.equal((await get('/api/v1/realtime')).status, 401, 'restricted in production');
    assert.deepEqual((await get('/')).body, { success: true, service: 'SkillBridge API', health: '/health' });
    console.log('  ✓ Open in local development only; restricted again in production');

    console.log('✅ Diagnostics Access Tests Passed\n');
  } finally {
    envRecord.NODE_ENV = originalEnv;
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runDiagnosticsAccessTests();
    } catch (err) {
      console.error('❌ Diagnostics Access Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
