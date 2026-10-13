import './setupEnv.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { listRoutes } from './helpers/routeInventory.js';

/**
 * docs/API_REFERENCE.md promises that its "All endpoints" tables list every endpoint. This reads
 * the routes from the router and fails for any that the tables do not mention, so the reference
 * cannot silently fall behind the code.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const doc = fs.readFileSync(path.resolve(here, '../../../docs/API_REFERENCE.md'), 'utf8');
const allEndpoints = doc.slice(doc.indexOf('## All endpoints'), doc.indexOf('\n## ', doc.indexOf('## All endpoints') + 5));

/** Rows as "METHOD /path", with any :param or {param} written as :p. */
function documented(): Set<string> {
  const rows = new Set<string>();
  for (const m of allEndpoints.matchAll(/\|\s*`(GET|POST|PUT|PATCH|DELETE)`\s*\|\s*`([^`]+)`/g)) {
    rows.add(`${m[1]} ${m[2].replace(/[:{][A-Za-z_]+\}?/g, ':p')}`);
  }
  return rows;
}

export function undocumentedRoutes(): string[] {
  const rows = documented();
  return listRoutes()
    .map(r => `${r.method} ${r.path.replace(/:[A-Za-z_]+\??/g, ':p').replace(/(.)\/$/, '$1')}`)
    .filter(r => !rows.has(r));
}

export async function runApiReferenceTests() {
  console.log('🧪 Running API Reference Coverage Tests...');
  const missing = undocumentedRoutes();
  assert.deepEqual(missing, [], `routes missing from docs/API_REFERENCE.md "All endpoints":\n${missing.join('\n')}`);
  console.log(`  ✓ Every one of the ${listRoutes().length} routes is listed in docs/API_REFERENCE.md`);
  console.log('✅ API Reference Coverage Tests Passed\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--list')) {
    for (const r of undocumentedRoutes()) console.log(r);
    process.exit(0);
  }
  runApiReferenceTests().then(() => process.exit(0), err => {
    console.error('❌ API Reference Test Failed:', err.message);
    process.exit(1);
  });
}
