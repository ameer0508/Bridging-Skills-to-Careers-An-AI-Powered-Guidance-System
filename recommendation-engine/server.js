/**
 * Recommendation Engine HTTP Server — port 5002
 * Exposes all engine functions as REST endpoints.
 * Called by the backend's resourceRoutes.js.
 */
'use strict';

const http = require('http');
const url  = require('url');

const { generateRecommendations, recommendResources,
        getResourcesBySkill, getResourcesByRole }  = require('./services/resourceService');
const { listCareers, getLearningSequence,
        matchCareersToSkills, getCareerDetails }    = require('./services/careerService');
const { listSkills, searchSkills, getCategories }  = require('./services/skillService');
const logger                                        = require('./utils/logger');

const PORT = process.env.REC_PORT || 5002;

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { resolve({}); }
    });
  });
}

function send(res, status, data) {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  // ── GET routes ──────────────────────────────────────────────
  if (req.method === 'GET') {
    if (pathname === '/health') {
      return send(res, 200, { success: true, data: { status: 'running', service: 'Recommendation Engine', port: PORT } });
    }
    if (pathname === '/api/rec/careers') {
      return send(res, 200, listCareers());
    }
    if (pathname === '/api/rec/skills') {
      return send(res, 200, listSkills());
    }
    if (pathname === '/api/rec/categories') {
      return send(res, 200, getCategories());
    }
    if (pathname.startsWith('/api/rec/careers/')) {
      const id = pathname.split('/').pop();
      return send(res, 200, getCareerDetails(id));
    }
    if (pathname.startsWith('/api/rec/skills/')) {
      const q = pathname.split('/').pop();
      return send(res, 200, searchSkills(q));
    }
    if (pathname.startsWith('/api/rec/resources/role/')) {
      const roleId = pathname.split('/').pop();
      return send(res, 200, getResourcesByRole(roleId));
    }
    if (pathname.startsWith('/api/rec/resources/skill/')) {
      const skillId = pathname.split('/').pop();
      return send(res, 200, getResourcesBySkill(skillId));
    }
    if (pathname.startsWith('/api/rec/sequence/')) {
      const roleId = pathname.split('/').pop();
      return send(res, 200, getLearningSequence(roleId));
    }
    return send(res, 404, { success: false, message: 'Endpoint not found' });
  }

  // ── POST routes ─────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = await readBody(req);

    if (pathname === '/api/rec/recommend') {
      const { userSkills = [], careerGoalId } = body;
      if (!careerGoalId) return send(res, 400, { success: false, message: 'careerGoalId required' });
      return send(res, 200, recommendResources(userSkills, careerGoalId));
    }

    if (pathname === '/api/rec/generate') {
      const { userId, currentSkills = [], careerGoal, name } = body;
      if (!careerGoal) return send(res, 400, { success: false, message: 'careerGoal required' });
      return send(res, 200, generateRecommendations({ userId, currentSkills, careerGoal, name }));
    }

    if (pathname === '/api/rec/match-careers') {
      const { skills = [] } = body;
      if (!skills.length) return send(res, 400, { success: false, message: 'skills required' });
      return send(res, 200, matchCareersToSkills(skills));
    }

    return send(res, 404, { success: false, message: 'Endpoint not found' });
  }

  return send(res, 405, { success: false, message: 'Method not allowed' });
});

server.listen(PORT, () => {
  logger.info(`🎯 Recommendation Engine running on http://localhost:${PORT}`);
  console.log(`\n🎯 Recommendation Engine running on http://localhost:${PORT}`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/rec/careers`);
  console.log(`   GET  /api/rec/skills`);
  console.log(`   POST /api/rec/recommend      { userSkills, careerGoalId }`);
  console.log(`   POST /api/rec/generate       { userId, currentSkills, careerGoal }`);
  console.log(`   POST /api/rec/match-careers  { skills }`);
});

module.exports = server;
