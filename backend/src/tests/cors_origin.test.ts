import './setupEnv.js';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../models/User.js';
import { startHttpHarness } from './helpers/httpHarness.js';

/**
 * Browser-origin enforcement over HTTP. An origin outside the allowlist is refused with 403
 * ORIGIN_NOT_ALLOWED before any route runs (it used to surface as a 500); allowlisted origins and
 * origin-less calls (server-to-server, curl, the backend's own health probes) work as before.
 * The dev server's same-origin and LAN handling is covered by frontend/devProxyOrigin.test.ts.
 */

const PASSWORD = 'Password123!';

export async function runCorsOriginTests() {
  console.log('🧪 Running CORS Origin Tests (HTTP)...');
  const h = await startHttpHarness();
  const url = (path: string) => `${h.origin}/api/v1${path}`;

  const send = async (method: string, path: string, origin: string | null, body?: string, type = 'application/json') => {
    const headers: Record<string, string> = {};
    if (origin !== null) headers.Origin = origin;
    if (body !== undefined) headers['Content-Type'] = type;
    const res = await fetch(url(path), { method, headers, body });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: res.status, json, acao: res.headers.get('access-control-allow-origin'), credentials: res.headers.get('access-control-allow-credentials') };
  };
  const register = (origin: string | null, email: string) =>
    send('POST', '/auth/register', origin, JSON.stringify({ fullName: 'Origin Synthetic', email, password: PASSWORD }));
  const created = async (email: string) => (await User.countDocuments({ email })) > 0;
  const refusedBeforeAnyRoute = (r: Awaited<ReturnType<typeof send>>) => {
    assert.equal(r.status, 403);
    assert.equal(r.json?.error?.code, 'ORIGIN_NOT_ALLOWED');
    assert.equal(r.acao, null, 'no CORS grant for a refused origin');
  };

  try {
    // --- Allowed -------------------------------------------------------------------------------
    const allowed = 'http://localhost:3000';
    const okEmail = `cors.ok.${Date.now()}@example.com`;
    const ok = await register(allowed, okEmail);
    assert.equal(ok.status, 201);
    assert.equal(ok.acao, allowed);
    assert.equal(ok.credentials, 'true');
    const login = await send('POST', '/auth/login', allowed, JSON.stringify({ email: okEmail, password: PASSWORD }));
    assert.equal(login.status, 200);
    const refresh = await send('POST', '/auth/refresh', allowed, JSON.stringify({ refreshToken: login.json.data.refreshToken }));
    assert.equal(refresh.status, 200, 'refresh works from the allowlisted frontend');
    const preflight = await send('OPTIONS', '/auth/login', allowed);
    assert.equal(preflight.status, 204);
    assert.equal(preflight.acao, allowed);

    // No Origin header: server-to-server callers and tools, unchanged
    const noOrigin = await send('POST', '/auth/login', null, JSON.stringify({ email: okEmail, password: PASSWORD }));
    assert.equal(noOrigin.status, 200);
    assert.equal(noOrigin.acao, null);
    console.log('  ✓ Allowlisted origin and origin-less calls work (register, login, refresh, preflight)');

    // --- Refused -------------------------------------------------------------------------------
    for (const origin of ['https://evil.example', 'null', 'http://192.168.1.40:3000', 'http://localhost:3001', 'https://localhost:3000', 'http://localhost:3000.evil.example']) {
      const email = `cors.bad.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`;
      const r = await register(origin, email);
      refusedBeforeAnyRoute(r);
      assert.equal(await created(email), false, `${origin}: the route never ran`);
    }
    console.log('  ✓ Malicious, null, LAN, other-port and other-scheme origins get 403 ORIGIN_NOT_ALLOWED and no route runs');

    // A cross-site form post needs no preflight; it must not reach the urlencoded parser's routes
    const formEmail = `cors.form.${Date.now()}@example.com`;
    const form = await send('POST', '/auth/register', 'https://evil.example',
      new URLSearchParams({ fullName: 'Form Synthetic', email: formEmail, password: PASSWORD }).toString(), 'application/x-www-form-urlencoded');
    refusedBeforeAnyRoute(form);
    assert.equal(await created(formEmail), false);

    const badPreflight = await send('OPTIONS', '/auth/login', 'https://evil.example');
    refusedBeforeAnyRoute(badPreflight);

    // The refusal says nothing about the server and is not reported as a server fault
    assert.equal(form.json?.success, false);
    assert.equal(form.json?.error?.message, 'CORS policy does not allow access from this origin.');
    console.log('  ✓ Cross-site form posts and preflights are refused the same way');

    console.log('✅ CORS Origin Tests Passed\n');
  } finally {
    await h.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    try {
      await runCorsOriginTests();
    } catch (err) {
      console.error('❌ CORS Origin Test Failed:', err);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  })();
}
