import http from 'http';
import type { AddressInfo } from 'net';

/**
 * Deterministic stand-in for the FastAPI AI service, used so backend tests never depend on
 * (or call) the real one. It implements only the endpoints the backend uses and enforces the
 * internal service key exactly like the real service, so missing credentials fail tests.
 */

const KNOWN_SKILLS: Array<[string, string]> = [
  ['Python', 'Programming Languages'],
  ['JavaScript', 'Programming Languages'],
  ['TypeScript', 'Programming Languages'],
  ['React', 'Frameworks'],
  ['Next.js', 'Frameworks'],
  ['Node.js', 'Frameworks'],
  ['FastAPI', 'Frameworks'],
  ['Redux', 'Frameworks'],
  ['PostgreSQL', 'Databases'],
  ['MongoDB', 'Databases'],
  ['Redis', 'Databases'],
  ['Docker', 'DevOps'],
  ['Kubernetes', 'DevOps'],
  ['Kafka', 'Tools'],
  ['GraphQL', 'Tools'],
  ['Git', 'Tools'],
  ['SQL', 'Databases'],
  ['HTML', 'Web'],
  ['CSS', 'Web'],
  // E1 careers (lexicon version 2); the real service reads them from the shared lexicon
  ['Playwright', 'Testing'], ['Appium', 'Testing'], ['JMeter', 'Testing'], ['ETL', 'Data Engineering'], ['Data Warehousing', 'Data Engineering'],
  ['Microcontrollers', 'Embedded Systems'], ['RTOS', 'Embedded Systems'], ['Verilog', 'Hardware Description'], ['VHDL', 'Hardware Description'],
  ['Google Analytics', 'Marketing'], ['SEO', 'Marketing'], ['Google Ads', 'Marketing'], ['Google Tag Manager', 'Marketing'], ['WordPress', 'Web'],
  ['Financial Modeling', 'Finance'], ['VBA', 'Programming Languages'], ['SAP', 'Enterprise Software'], ['SAS', 'Analytics'],
  ['EHR Systems', 'Healthcare IT'], ['Healthcare Data Standards', 'Healthcare IT']
];

const entity = (value: string) => ({ value, confidence: 0.9, source: 'fake_ai_service' });

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsTerm = (text: string, term: string) =>
  new RegExp(`(?<![a-z0-9])${escapeRegExp(term)}(?![a-z0-9])`, 'i').test(text);

function parseResumeText(text: string) {
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0];
  const phone = text.match(/\+?\d[\d\s().-]{7,}\d/)?.[0];
  const linkedin = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0];
  const github = text.match(/https?:\/\/(?:www\.)?github\.com\/[\w-]+/i)?.[0];
  const lines = text.split(/\r?\n/).map(l => l.trim());

  const section = (name: string) => {
    const start = lines.findIndex(l => l.toLowerCase() === `${name}:`);
    if (start === -1) return [] as string[];
    const rest = lines.slice(start + 1);
    const end = rest.findIndex(l => /^[A-Za-z ]+:$/.test(l));
    return (end === -1 ? rest : rest.slice(0, end)).filter(Boolean);
  };

  const experienceLines = section('experience');
  const projectLines = section('projects');

  return {
    personalInfo: {
      // Skip the "%PDF-" marker the test payloads start with
      fullName: entity(lines.find(l => l && !l.startsWith('%')) || 'Candidate'),
      email: email ? entity(email) : null,
      phone: phone ? entity(phone) : null,
      linkedin: linkedin ? entity(linkedin) : null,
      github: github ? entity(github) : null
    },
    education: [],
    experience: experienceLines.length
      ? [
          {
            role: entity(experienceLines[0].split(' at ')[0]),
            company: entity((experienceLines[0].split(' at ')[1] || '').replace(/\s*\(.*\)$/, '')),
            // The period in brackets after the employer, as the real parser reports it
            duration: /\(([^)]+)\)\s*$/.test(experienceLines[0]) ? entity(experienceLines[0].match(/\(([^)]+)\)\s*$/)![1]) : null,
            responsibilities: experienceLines.slice(1).map(entity)
          }
        ]
      : [],
    projects: projectLines.length
      ? [
          {
            name: entity(projectLines[0]),
            description: entity(projectLines.slice(1).join(' ')),
            technologies: [],
            contributions: []
          }
        ]
      : [],
    skills: KNOWN_SKILLS.filter(([name]) => containsTerm(text, name)).map(([name, category]) => ({
      name,
      category,
      confidence: 0.95
    })),
    certifications: [],
    achievements: [],
    languages: [],
    interests: []
  };
}

function extractUploadedText(rawBody: Buffer): string {
  const body = rawBody.toString('utf8');
  const start = body.indexOf('\r\n\r\n', body.indexOf('filename='));
  const end = body.indexOf('\r\n--', start + 4);
  return start === -1 ? '' : body.slice(start + 4, end === -1 ? undefined : end);
}

export type FakeInterviewMode = 'unavailable' | 'ok' | 'invalid' | 'slow';

export interface FakeAiService {
  url: string;
  /** How /api/v1/interview/evaluate behaves. Defaults to 'unavailable' (no provider). */
  interview: { mode: FakeInterviewMode; rubric: Record<string, unknown> };
  /**
   * How /api/v1/interview/questions behaves. Defaults to 'unavailable' (no provider).
   * 'ok' returns `set`; 'short' returns one question fewer than requested.
   */
  questions: { mode: 'unavailable' | 'ok' | 'short'; set: Array<Record<string, unknown>>; payloads: Array<Record<string, any>> };
  /** How /api/v1/chat behaves. Defaults to 'ok' (a deterministic reply from a named fake provider). */
  chat: { mode: 'ok' | 'unavailable' | 'slow' | 'error'; reply: string; delayMs: number; prompts: string[] };
  /** How /api/v1/extract behaves: 'ok', 'fail' (500) or 'slow' (answers after `delayMs`). */
  extract: { mode: 'ok' | 'fail' | 'slow'; delayMs: number };
  /** Paths requested since start, e.g. "POST /api/v1/extract". */
  requests: string[];
  stop: () => Promise<void>;
}

let shared: FakeAiService | null = null;

/**
 * Starts the fake once per process and points the backend's AI client at it.
 * Safe to call from every test that needs AI responses.
 */
export async function ensureFakeAiService(): Promise<FakeAiService> {
  if (!shared) {
    shared = await startFakeAiService(process.env.INTERNAL_SERVICE_KEY || '');
    process.env.AI_SERVICE_URL = shared.url;
  }
  return shared;
}

/**
 * @param listenPort fixed port for runs where another process must be told the URL up front (0 = any free port)
 */
export async function startFakeAiService(serviceKey: string, listenPort = 0): Promise<FakeAiService> {
  const requests: string[] = [];
  const interview: FakeAiService['interview'] = { mode: 'unavailable', rubric: {} };
  const extract: FakeAiService['extract'] = { mode: 'ok', delayMs: 400 };
  const chat: FakeAiService['chat'] = { mode: 'ok', reply: 'Deterministic test reply.', delayMs: 1500, prompts: [] };
  const questions: FakeAiService['questions'] = { mode: 'unavailable', set: [], payloads: [] };

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(chunk as Buffer));
    req.on('end', () => {
      const path = (req.url || '').split('?')[0];
      requests.push(`${req.method} ${path}`);

      const send = (status: number, payload: unknown) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
      };

      if (path === '/api/v1/health') {
        return send(200, { status: 'healthy', providers: {} });
      }
      if (req.headers['x-internal-service-key'] !== serviceKey) {
        return send(401, { detail: 'Invalid or missing service credentials.' });
      }

      const raw = Buffer.concat(chunks);

      // Test control, used by the browser smoke tests (a separate process) to switch behaviour
      // and to read what was requested. Not part of the real AI service's API.
      if (path === '/__control') {
        if (req.method === 'POST') {
          const patch = JSON.parse(raw.toString('utf8') || '{}') as Record<string, Record<string, unknown>>;
          Object.assign(interview, patch.interview || {});
          Object.assign(extract, patch.extract || {});
          Object.assign(chat, patch.chat || {});
          Object.assign(questions, patch.questions || {});
        }
        return send(200, {
          requests,
          interview: { mode: interview.mode },
          extract: { mode: extract.mode },
          chat: { mode: chat.mode, prompts: chat.prompts.length },
          questions: { mode: questions.mode, payloads: questions.payloads.length }
        });
      }

      if (path === '/api/v1/extract') {
        if (extract.mode === 'fail') return send(500, { detail: 'Extraction failed (simulated).' });
        const data = parseResumeText(extractUploadedText(raw));
        const reply = () => send(200, { success: true, provider: 'fake_ai_service', data, response: data });
        if (extract.mode === 'slow') {
          setTimeout(reply, extract.delayMs).unref();
          return;
        }
        return reply();
      }
      // AI observability (X11): echoes the forwarded query. The real audit log is tested in
      // ai/tests/test_observability.py.
      if (path.startsWith('/api/v1/observability/')) {
        const query = Object.fromEntries(new URL(req.url || '', 'http://fake').searchParams);
        const section = path.slice('/api/v1/observability/'.length);
        if (section === 'summary') return send(200, { success: true, data: { windowHours: Number(query.window_hours), events: 2, providers: { mock: { attempts: 1, successes: 1, failures: {}, policyRefusals: {}, rateLimited: 0, quotaPauses: 0, lastFailureAt: null, latencyMs: { p50: 12, p95: 12, samples: 1 }, failureRate: 0 } }, services: { chat_architect: { requests: 1, successes: 1, allFailed: 0, noProvider: 0, cacheHits: 0, fallbacks: 0 } }, retentionDays: 14, persisted: false, scope: { source: 'memory', coverage: 'This AI-service process only, since it started. Events from other processes and from before the last restart are not included.', instanceId: 'a1b2c3d4', processStartedAt: '2026-10-12T00:00:00+00:00', writeFailures: 0 } } });
        if (section === 'events') return send(200, { success: true, data: { events: [{ at: '2026-10-12T00:00:00+00:00', kind: 'success', service: 'chat_architect', provider: 'mock', reason: null, attempt: 1, latency_ms: 12, personal_data: true, skipped: {} }], retentionDays: 14, query } });
        if (section === 'providers') return send(200, { success: true, data: { providers: [{ provider: 'openai', status: 'BLOCKED', available: false, personalData: { allowed: false, reason: 'blocked' }, nonPersonalData: { allowed: false, reason: 'blocked' }, quotaRemaining: null }] } });
        return send(404, { detail: 'Not found' });
      }
      // Multilingual analysis (E5): a fixed-shape reply keyed on markers in the text. The real
      // extraction is tested in ai/tests/test_multilingual.py.
      if (path === '/api/v1/multilingual/analyze' || path === '/api/v1/multilingual/analyze-text') {
        const text = path.endsWith('analyze-text')
          ? (JSON.parse(raw.toString('utf8') || '{}') as { text?: string }).text || ''
          : extractUploadedText(raw);
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (text.includes('SCANNED')) {
          return send(200, { success: true, data: { method: 'multilingual-rules-3', status: 'scanned_unreadable', language: { language: null, supported: false, status: 'too_little_text', message: 'Only 0 words.' }, layout: { type: 'single_column', pages: 1, scannedPages: 1 }, textQuality: 'ok', warnings: ['1 of 1 page(s) look scanned (images without a text layer). SkillBridge has no OCR, so their text cannot be read.'], sections: [], fields: { email: null, phone: null, experience: [], education: [], skills: [] }, lineCount: 0, originalLines: [], fileType: 'pdf' } });
        }
        if (text.includes('Compétences')) {
          return send(200, { success: true, data: { method: 'multilingual-rules-3', status: 'unsupported', language: { language: 'fr', supported: false, status: 'unsupported_language', message: 'This resume looks like French. Supported: English, Hindi, Spanish.' }, layout: { type: 'plain_text', pages: 1, scannedPages: 0 }, textQuality: 'ok', warnings: ['This resume looks like French. Supported: English, Hindi, Spanish.'], sections: [], fields: { email: null, phone: null, experience: [], education: [], skills: [] }, lineCount: lines.length, originalLines: lines, fileType: 'text' } });
        }
        const hindi = /[ऀ-ॿ]/.test(text);
        const emailLine = lines.findIndex(l => /@/.test(l));
        const skills = KNOWN_SKILLS.map(([n]) => n).filter(n => containsTerm(text, n));
        return send(200, {
          success: true,
          data: {
            method: 'multilingual-rules-3',
            status: 'extracted',
            language: { language: hindi ? 'hi' : 'en', name: hindi ? 'Hindi' : 'English', supported: true, status: 'detected', mixed: hindi && /[A-Za-z]/.test(text), scripts: {}, words: lines.join(' ').split(/\s+/).length },
            layout: { type: 'plain_text', pages: 1, scannedPages: 0 },
            textQuality: 'ok',
            textRecovery: { glyphsRecovered: 0, glyphsUnrecovered: 0 },
            warnings: [],
            sections: lines.map((l, i) => (/^(कौशल|skills)$/i.test(l) ? { key: 'skills', heading: l, headingLanguage: hindi ? 'hi' : 'en', startLine: i, endLine: i + 1 } : null)).filter(Boolean),
            fields: {
              email: emailLine >= 0 ? { value: lines[emailLine].match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0] ?? null, source: { line: emailLine, text: lines[emailLine] } } : null,
              phone: null,
              experience: [],
              education: [],
              skills: skills.map(n => {
                const line = lines.findIndex(l => containsTerm(l, n));
                return { name: n, matched: n, source: { line, text: lines[line] } };
              }),
            },
            lineCount: lines.length,
            originalLines: lines,
            fileType: path.endsWith('analyze-text') ? 'text' : 'txt',
          },
        });
      }
      if (path === '/api/v1/skills/normalize') {
        const { skills = [] } = JSON.parse(raw.toString('utf8') || '{}') as { skills?: string[] };
        const categoryOf = new Map(KNOWN_SKILLS.map(([n, c]) => [n.toLowerCase(), c]));
        return send(200, {
          success: true,
          normalized_skills: skills.map(name => ({
            raw_name: name,
            canonical_name: name,
            category: categoryOf.get(name.toLowerCase()) || 'General',
            aliases: [name.toLowerCase()],
            relationships: []
          }))
        });
      }
      if (path === '/api/v1/interview/evaluate') {
        if (interview.mode === 'unavailable') return send(503, { success: false, error: 'AI evaluation is unavailable.' });
        if (interview.mode === 'invalid') return send(200, { success: true, provider: 'fake', data: { relevance: 'high', score: 99 } });
        if (interview.mode === 'slow') {
          setTimeout(() => send(200, { success: true, provider: 'fake', data: interview.rubric }), 1500).unref();
          return;
        }
        return send(200, { success: true, provider: 'fake', model: 'fake-rubric', data: interview.rubric });
      }
      if (path === '/api/v1/interview/questions') {
        const body = JSON.parse(raw.toString('utf8') || '{}') as Record<string, any>;
        questions.payloads.push(body);
        if (questions.mode === 'unavailable') return send(503, { success: false, error: 'AI question generation is unavailable.' });
        const count = Number(body.count) || 5;
        const set = questions.set.slice(0, questions.mode === 'short' ? count - 1 : count);
        return send(200, { success: true, provider: 'fake', model: 'fake-questions', data: { questions: set } });
      }
      if (path === '/api/v1/chat') {
        chat.prompts.push(String((JSON.parse(raw.toString('utf8') || '{}') as { prompt?: string }).prompt || ''));
        if (chat.mode === 'unavailable') return send(503, { success: false, code: 'AI_UNAVAILABLE', error: 'AI chat is unavailable.' });
        if (chat.mode === 'error') return send(500, { detail: 'Internal Server Error' });
        const reply = () => send(200, { success: true, data: chat.reply, provider: 'fake_ai_service', model: 'fake-chat-model' });
        if (chat.mode === 'slow') {
          setTimeout(reply, chat.delayMs).unref();
          return;
        }
        return reply();
      }
      return send(404, { detail: 'Not implemented in fake AI service.' });
    });
  });

  await new Promise<void>(resolve => server.listen(listenPort, '127.0.0.1', resolve));
  server.unref(); // never keep the test process alive
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    interview,
    extract,
    questions,
    chat,
    stop: () => new Promise<void>(resolve => server.close(() => resolve()))
  };
}
