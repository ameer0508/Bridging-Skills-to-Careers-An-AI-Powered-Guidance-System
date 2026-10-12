// Starts an isolated copy of the whole stack, runs the browser smoke tests against it, and
// removes everything again.
//
//   stub AI service  (backend/src/tests/helpers/runFakeAiService.ts)   no AI provider is contacted
//   backend          (backend/src/server.ts)     embedded MongoDB + uploads inside a temp directory
//   frontend         (Vite dev server)           pointed at that backend
//
// Nothing here reads or writes the developer's database, uploads or .env secrets: every
// setting the backend needs is passed explicitly, and explicit environment variables take
// precedence over backend/.env.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const backendDir = path.join(root, 'backend');
const frontendDir = path.join(root, 'frontend');
const tsxCli = path.join(backendDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const viteCli = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

async function waitFor(url, label, child, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'no response';
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${label} stopped during startup (exit code ${child.exitCode})`);
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
      lastError = `HTTP ${res.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${label} did not become ready at ${url} (${lastError})`);
}

const children = [];
function start(label, args, { cwd, env, logFile }) {
  const out = fs.openSync(logFile, 'a');
  const child = spawn(process.execPath, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', out, out] });
  child.on('exit', (code) => {
    if (code && !shuttingDown) console.error(`[e2e] ${label} exited early with code ${code}; see ${logFile}`);
  });
  children.push({ label, child });
  return child;
}

let shuttingDown = false;
function stopAll() {
  shuttingDown = true;
  for (const { child } of children.reverse()) {
    if (child.exitCode !== null || !child.pid) continue;
    if (process.platform === 'win32') {
      // Also ends the embedded MongoDB that the backend started as its own child process
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
}

function removeDir(dir) {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      return true;
    } catch {
      // Files can stay locked for a moment after the database stops (Windows)
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
    }
  }
  return false;
}

function tail(file, lines = 25) {
  try {
    return fs.readFileSync(file, 'utf8').trimEnd().split(/\r?\n/).slice(-lines).join('\n');
  } catch {
    return '(no log)';
  }
}

async function main() {
  for (const required of [tsxCli, viteCli]) {
    if (!fs.existsSync(required)) throw new Error(`Missing ${required}. Run "pnpm install" at the repository root first.`);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skillbridge-e2e-'));
  const [aiPort, apiPort, webPort] = [await freePort(), await freePort(), await freePort()];
  const serviceKey = `e2e-internal-key-${Date.now()}`;
  const aiUrl = `http://127.0.0.1:${aiPort}`;
  const apiUrl = `http://127.0.0.1:${apiPort}/api/v1`;
  const webUrl = `http://127.0.0.1:${webPort}`;
  const logs = { ai: path.join(tmpDir, 'ai.log'), backend: path.join(tmpDir, 'backend.log'), frontend: path.join(tmpDir, 'frontend.log') };
  let failures = 1;

  try {
    console.log(`[e2e] workspace ${tmpDir}`);

    const aiProcess = start('stub AI service', [tsxCli, path.join(backendDir, 'src', 'tests', 'helpers', 'runFakeAiService.ts')], {
      cwd: backendDir,
      env: { FAKE_AI_PORT: String(aiPort), INTERNAL_SERVICE_KEY: serviceKey, LOG_DIR: path.join(tmpDir, 'ai-logs') },
      logFile: logs.ai,
    });

    // cwd is the temp directory: the embedded MongoDB stores its files under <cwd>/data/local_db
    const backendProcess = start('backend', [tsxCli, path.join(backendDir, 'src', 'server.ts')], {
      cwd: tmpDir,
      env: {
        NODE_ENV: 'development',
        PORT: String(apiPort),
        MONGODB_URI: 'mongodb://localhost:27017/skillbridge-e2e', // a local URI selects the embedded database
        AI_SERVICE_URL: aiUrl,
        INTERNAL_SERVICE_KEY: serviceKey,
        JWT_ACCESS_SECRET: 'e2e-access-secret-not-used-anywhere-else',
        JWT_REFRESH_SECRET: 'e2e-refresh-secret-not-used-anywhere-else',
        UPLOAD_DIR: path.join(tmpDir, 'uploads'),
        LOG_DIR: path.join(tmpDir, 'logs'),
        FRONTEND_URL: webUrl,
        // No live providers: job search uses the labelled demo listings
        RAPIDAPI_KEY: '',
        JSEARCH_API_KEY: '',
        GEMINI_API_KEY: '',
      },
      logFile: logs.backend,
    });

    const frontendProcess = start('frontend', [viteCli, '--port', String(webPort), '--strictPort', '--host', '127.0.0.1'], {
      cwd: frontendDir,
      env: { VITE_API_URL: apiUrl },
      logFile: logs.frontend,
    });

    await waitFor(`${aiUrl}/api/v1/health`, 'stub AI service', aiProcess);
    await waitFor(`http://127.0.0.1:${apiPort}/health`, 'backend', backendProcess, 180_000);
    await waitFor(webUrl, 'frontend', frontendProcess);
    console.log(`[e2e] stack ready: web ${webUrl}, api ${apiUrl}, stub AI ${aiUrl}`);

    /** Reads or changes how the stub AI service behaves. */
    const aiControl = async (patch) => {
      const res = await fetch(`${aiUrl}/__control`, {
        method: patch ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Service-Key': serviceKey },
        body: patch ? JSON.stringify(patch) : undefined,
      });
      return res.json();
    };

    const { run } = await import(process.env.E2E_TEST_FILE || './tests/smoke.mjs');
    failures = await run({ webUrl, apiUrl, aiControl, tmpDir });
  } catch (error) {
    console.error(`[e2e] ${error.stack || error.message}`);
    console.error(`--- backend log (tail) ---\n${tail(logs.backend)}`);
    console.error(`--- frontend log (tail) ---\n${tail(logs.frontend, 10)}`);
  } finally {
    stopAll();
    if (process.env.E2E_KEEP === '1') {
      console.log(`[e2e] kept ${tmpDir} (E2E_KEEP=1)`);
    } else if (!removeDir(tmpDir)) {
      console.warn(`[e2e] could not remove ${tmpDir}; it is safe to delete by hand.`);
    }
  }

  process.exit(failures ? 1 : 0);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopAll();
    process.exit(130);
  });
}

main();
