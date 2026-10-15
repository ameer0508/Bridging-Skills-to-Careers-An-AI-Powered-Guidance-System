// Run: npx tsx --test frontend/devProxyOrigin.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEV_FRONTEND_ORIGIN, devProxyOrigin } from './devProxyOrigin';

test('the dev frontend opened by an allowlisted address keeps an allowlisted origin', () => {
  assert.equal(devProxyOrigin('http://localhost:3000', 'localhost:3000'), DEV_FRONTEND_ORIGIN);
  assert.equal(devProxyOrigin('http://127.0.0.1:3000', '127.0.0.1:3000'), DEV_FRONTEND_ORIGIN);
});

test('the dev frontend opened by LAN IP is re-labelled so the backend accepts it', () => {
  assert.equal(devProxyOrigin('http://192.168.1.40:3000', '192.168.1.40:3000'), DEV_FRONTEND_ORIGIN);
  assert.equal(devProxyOrigin('http://LOCALHOST:3000', 'localhost:3000'), DEV_FRONTEND_ORIGIN);
});

test('requests without an Origin header are left alone', () => {
  assert.equal(devProxyOrigin(undefined, 'localhost:3000'), undefined);
  assert.equal(devProxyOrigin('', 'localhost:3000'), '');
});

test('other websites keep their own origin, so the backend allowlist refuses them', () => {
  for (const origin of [
    'https://evil.example',
    'http://evil.example:3000',
    'http://localhost:5173.evil.example',
    'http://192.168.1.41:3000', // another machine on the LAN
    'http://localhost:3001', // another local port
    'https://localhost:3000', // different scheme
    'null', // sandboxed iframe or file:// page
    'not a url',
  ]) {
    assert.equal(devProxyOrigin(origin, 'localhost:3000'), origin, origin);
  }
});

test('a missing Host header never turns a foreign origin into an allowed one', () => {
  assert.equal(devProxyOrigin('https://evil.example', undefined), 'https://evil.example');
});
