import { startFakeAiService } from './fakeAiService.js';

/**
 * Runs the deterministic stand-in for the AI service as its own process, for the browser smoke
 * tests in /e2e. It never contacts an AI provider.
 *
 *   FAKE_AI_PORT           port to listen on (required)
 *   INTERNAL_SERVICE_KEY   key the backend will present (required)
 */
const port = Number(process.env.FAKE_AI_PORT);
const serviceKey = process.env.INTERNAL_SERVICE_KEY || '';

if (!port || !serviceKey) {
  console.error('FAKE_AI_PORT and INTERNAL_SERVICE_KEY are required.');
  process.exit(1);
}

const fake = await startFakeAiService(serviceKey, port);
console.log(`Fake AI service listening on ${fake.url}`);

// startFakeAiService un-refs its server so tests can exit; here the server is the whole point
setInterval(() => undefined, 60_000);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void fake.stop().then(() => process.exit(0));
  });
}
