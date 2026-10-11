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
  ['CSS', 'Web']
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
      fullName: entity(lines[0] || 'Candidate'),
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

export interface FakeAiService {
  url: string;
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

export async function startFakeAiService(serviceKey: string): Promise<FakeAiService> {
  const requests: string[] = [];

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
      if (path === '/api/v1/extract') {
        const data = parseResumeText(extractUploadedText(raw));
        return send(200, { success: true, provider: 'fake_ai_service', data, response: data });
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
      if (path === '/api/v1/chat') {
        return send(200, { success: true, data: 'Deterministic test reply.', provider: 'fake_ai_service' });
      }
      return send(404, { detail: 'Not implemented in fake AI service.' });
    });
  });

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  server.unref(); // never keep the test process alive
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    stop: () => new Promise<void>(resolve => server.close(() => resolve()))
  };
}
