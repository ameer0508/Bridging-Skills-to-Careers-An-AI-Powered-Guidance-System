/**
 * Resource Routes — powered by Recommendation Engine (port 5002)
 * Falls back to static data if engine is unavailable.
 */
'use strict';

const express = require('express');
const http    = require('http');
const { sendSuccess } = require('../utils/responseHelper');

const router = express.Router();
const REC_BASE = process.env.REC_SERVER_URL || 'http://localhost:5002';

// ── Internal HTTP proxy to recommendation engine ───────────────
function recRequest(path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const url     = new URL(path, REC_BASE);
    const options = {
      hostname: url.hostname, port: url.port || 5002, path: url.pathname,
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) },
      timeout: 5000,
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid response')); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Recommendation engine timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

// Static fallback resources
const STATIC = [
  { id:1,  title:'TypeScript: Complete Guide',     platform:'Udemy',     type:'Course',        skill:'TypeScript',   rating:4.8, duration:'27h', price:'Paid'     },
  { id:2,  title:'System Design Interview',         platform:'Educative', type:'Course',        skill:'System Design',rating:4.9, duration:'20h', price:'Paid'     },
  { id:3,  title:'AWS Solutions Architect',         platform:'AWS',       type:'Certification', skill:'Cloud',        rating:4.8, duration:'40h', price:'Paid'     },
  { id:4,  title:'LeetCode Premium',                platform:'LeetCode',  type:'Practice',      skill:'Algorithms',   rating:4.9, duration:'∞',   price:'Freemium' },
  { id:5,  title:'Machine Learning A-Z',            platform:'Udemy',     type:'Course',        skill:'ML',           rating:4.5, duration:'44h', price:'Paid'     },
  { id:6,  title:'CS50 AI with Python',             platform:'edX',       type:'Course',        skill:'AI',           rating:4.9, duration:'30h', price:'Free'     },
  { id:7,  title:'React — The Complete Guide',      platform:'Udemy',     type:'Course',        skill:'React',        rating:4.7, duration:'68h', price:'Paid'     },
  { id:8,  title:'Node.js, Express & MongoDB',      platform:'Udemy',     type:'Course',        skill:'Node.js',      rating:4.8, duration:'42h', price:'Paid'     },
  { id:9,  title:'Docker & Kubernetes Guide',       platform:'Udemy',     type:'Course',        skill:'Docker',       rating:4.7, duration:'23h', price:'Paid'     },
  { id:10, title:'Google Cloud Professional',       platform:'Google',    type:'Certification', skill:'Cloud',        rating:4.7, duration:'60h', price:'Paid'     },
  { id:11, title:'Kaggle Learn & Competitions',     platform:'Kaggle',    type:'Practice',      skill:'Data Science', rating:4.8, duration:'∞',   price:'Free'     },
  { id:12, title:'HackerRank Developer Skills',     platform:'HackerRank',type:'Practice',      skill:'Programming',  rating:4.6, duration:'∞',   price:'Free'     },
];

// ── GET /api/resources ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { role, skill, type, page = 1, limit = 20 } = req.query;

    try {
      if (role) {
        const roleKey = role.toLowerCase().replace(/\s+/g, '_');
        const result  = await recRequest(`/api/rec/resources/role/${roleKey}`);
        if (result.success) {
          return sendSuccess(res, 200, 'Resources retrieved', { resources: result.data, source: 'recommendation-engine' });
        }
      }
      if (skill) {
        const result = await recRequest(`/api/rec/resources/skill/${skill.toLowerCase()}`);
        if (result.success) {
          return sendSuccess(res, 200, 'Resources retrieved', { resources: result.data, source: 'recommendation-engine' });
        }
      }
    } catch {}

    // Static fallback
    let resources = [...STATIC];
    if (type) resources = resources.filter(r => r.type.toLowerCase() === type.toLowerCase());
    if (skill) resources = resources.filter(r => r.skill.toLowerCase().includes(skill.toLowerCase()));
    const start     = (Number(page) - 1) * Number(limit);
    const paginated = resources.slice(start, start + Number(limit));
    return sendSuccess(res, 200, 'Resources retrieved', { resources: paginated, total: resources.length, page: Number(page), limit: Number(limit), totalPages: Math.ceil(resources.length / Number(limit)), source: 'static-fallback' });
  } catch (err) { next(err); }
});

// ── POST /api/resources/recommend ─────────────────────────────
router.post('/recommend', async (req, res, next) => {
  try {
    const { skills = [], targetRole, userId } = req.body;

    if (targetRole) {
      try {
        const roleKey = targetRole.toLowerCase().replace(/\s+/g, '_');
        const result  = await recRequest('/api/rec/generate', {
          userId: userId || 'anonymous',
          currentSkills: skills.map(s => s.toLowerCase()),
          careerGoal: roleKey,
        });
        if (result.success) {
          return sendSuccess(res, 200, 'Personalized recommendations generated', { ...result.data, source: 'recommendation-engine' });
        }
      } catch {}
    }

    return sendSuccess(res, 200, 'Recommendations (static)', { resources: STATIC.slice(0, 6), source: 'static-fallback' });
  } catch (err) { next(err); }
});

// ── GET /api/resources/careers ────────────────────────────────
router.get('/careers', async (req, res, next) => {
  try {
    const result = await recRequest('/api/rec/careers');
    return sendSuccess(res, 200, 'Career roles retrieved', result.data || result);
  } catch {
    return sendSuccess(res, 200, 'Career roles (static)', ['Frontend Developer','Backend Developer','Full Stack Developer','Data Analyst','Machine Learning Engineer','Cybersecurity Analyst']);
  }
});

module.exports = router;
