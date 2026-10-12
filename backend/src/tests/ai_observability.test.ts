import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User.js';
import { ensureFakeAiService } from './helpers/fakeAiService.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * X11 on the backend: the AI gateway's audit data is served to administrators only (role read from
 * the database on every request), query parameters are validated before forwarding, and an
 * unreachable AI service gives an honest 503. (The audit log itself is tested in
 * ai/tests/test_observability.py.)
 */
export async function runAiObservabilityTests() {
  console.log('🧪 Running AI Observability (X11) Tests...');
  await ensureFakeAiService();
  const h = await startHttpHarness();
  try {
    assert.equal((await h.api('GET', '/ai-observability/summary')).status, 401);
    const user = await h.registerUser('obs-user');
    const admin = await h.registerUser('obs-admin');
    for (const p of ['/ai-observability/summary', '/ai-observability/events', '/ai-observability/providers']) {
      assert.equal((await h.api('GET', p, { token: user.token })).status, 403, `${p} refuses a non-administrator`);
    }
    await User.updateOne({ _id: admin.userId }, { $set: { role: 'admin' } });
    const A = (p: string) => h.api('GET', p, { token: admin.token });

    let r = await A('/ai-observability/summary?windowHours=48');
    assert.equal(r.status, 200);
    assert.equal(r.body.data.windowHours, 48, 'the window is forwarded');
    assert.equal(r.body.data.providers.mock.latencyMs.p50, 12);
    r = await A('/ai-observability/events?limit=5');
    assert.deepEqual(r.body.data.query, { limit: '5', window_hours: '24' }, 'defaults are filled in and names mapped');
    r = await A('/ai-observability/providers');
    assert.equal(r.body.data.providers[0].personalData.allowed, false);
    console.log('  ✓ Administrators only (401 signed out, 403 for 3 endpoints as a user); summary, events and providers forwarded');

    for (const bad of ['/ai-observability/summary?windowHours=0', '/ai-observability/summary?windowHours=99999',
      '/ai-observability/summary?windowHours=1.5', '/ai-observability/events?limit=501', '/ai-observability/events?limit=-1',
      '/ai-observability/events?service=chat', '/ai-observability/providers?x=1']) {
      assert.equal((await A(bad)).status, 400, bad);
    }
    console.log('  ✓ 7 invalid queries refused with 400');

    // A demoted administrator loses access immediately, whatever the token says
    await User.updateOne({ _id: admin.userId }, { $set: { role: 'user' } });
    assert.equal((await A('/ai-observability/summary')).status, 403);
    await User.updateOne({ _id: admin.userId }, { $set: { role: 'admin' } });

    const saved = process.env.AI_SERVICE_URL;
    process.env.AI_SERVICE_URL = 'http://127.0.0.1:9';
    try {
      r = await A('/ai-observability/summary');
      assert.deepEqual([r.status, r.body.error?.code], [503, 'AI_UNAVAILABLE']);
    } finally {
      process.env.AI_SERVICE_URL = saved;
    }
    console.log('  ✓ Demotion takes effect at once; AI service down gives 503');
  } finally {
    await h.close();
  }
  console.log('✅ AI Observability (X11) Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runAiObservabilityTests();
    } catch (err) {
      console.error('❌ AI Observability Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
      process.exit();
    }
  })();
}
