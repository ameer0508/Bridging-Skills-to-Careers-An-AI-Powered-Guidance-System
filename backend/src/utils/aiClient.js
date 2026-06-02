/**
 * AI Client — calls the Python AI server on port 5001
 * Falls back gracefully if AI server is unavailable.
 */
const http = require('http');

const AI_BASE = process.env.AI_SERVER_URL || 'http://localhost:5001';

function aiRequest(path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const url = new URL(path, AI_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || 5001,
      path: url.pathname,
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) },
      timeout: 8000,
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid AI response')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('AI server timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

const aiClient = {
  health:             ()           => aiRequest('/health'),
  extractSkills:      (text)       => aiRequest('/api/ai/extract-skills', { text }),
  analyzeSkillGap:    (skills, role) => aiRequest('/api/ai/skill-gap', { skills, targetRole: role }),
  matchCareers:       (skills)     => aiRequest('/api/ai/career-match', { skills }),
  computeReadiness:   (skills, role, hasResume, progress) =>
                        aiRequest('/api/ai/readiness', { skills, targetRole: role, hasResume, roadmapProgress: progress }),
  parseResume:        (fileContent, fileType) =>
                        aiRequest('/api/ai/parse-resume', { fileContent, fileType }),
  interviewQuestions: (role, count) =>
                        aiRequest('/api/ai/interview-questions', { targetRole: role, count }),
  getRoles:           ()           => aiRequest('/api/ai/roles'),
};

module.exports = aiClient;
