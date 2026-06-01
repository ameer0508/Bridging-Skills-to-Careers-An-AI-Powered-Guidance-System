/**
 * Resource Routes — integrates recommendation engine
 */
const express = require('express');
const { query } = require('express-validator');
const validate = require('../middleware/validate');
const { sendSuccess } = require('../utils/responseHelper');

const router = express.Router();

let getResourcesByRole, getResourcesBySkill, recommendResources;
try {
  const svc = require('../../../recommendation-engine/services/resourceService');
  getResourcesByRole  = svc.getResourcesByRole;
  getResourcesBySkill = svc.getResourcesBySkill;
  recommendResources  = svc.recommendResources;
} catch (e) {
  console.warn('⚠️  Resource service unavailable:', e.message);
}

// Fallback static resources
const STATIC_RESOURCES = [
  { id:1,  title:'TypeScript: Complete Guide',      platform:'Udemy',     type:'Course',        skill:'TypeScript',    level:'Intermediate', rating:4.8, duration:'27h', price:'Paid',     url:'https://udemy.com' },
  { id:2,  title:'System Design Interview',          platform:'Educative', type:'Course',        skill:'System Design', level:'Advanced',     rating:4.9, duration:'20h', price:'Paid',     url:'https://educative.io' },
  { id:3,  title:'AWS Solutions Architect',          platform:'AWS',       type:'Certification', skill:'Cloud',         level:'Intermediate', rating:4.8, duration:'40h', price:'Paid',     url:'https://aws.amazon.com' },
  { id:4,  title:'LeetCode Premium',                 platform:'LeetCode',  type:'Practice',      skill:'Algorithms',    level:'All',          rating:4.9, duration:'∞',   price:'Freemium', url:'https://leetcode.com' },
  { id:5,  title:'Machine Learning A-Z',             platform:'Udemy',     type:'Course',        skill:'ML',            level:'Beginner',     rating:4.5, duration:'44h', price:'Paid',     url:'https://udemy.com' },
  { id:6,  title:'CS50 AI with Python',              platform:'edX',       type:'Course',        skill:'AI',            level:'Beginner',     rating:4.9, duration:'30h', price:'Free',     url:'https://edx.org' },
  { id:7,  title:'React — The Complete Guide',       platform:'Udemy',     type:'Course',        skill:'React',         level:'Beginner',     rating:4.7, duration:'68h', price:'Paid',     url:'https://udemy.com' },
  { id:8,  title:'Node.js, Express & MongoDB',       platform:'Udemy',     type:'Course',        skill:'Node.js',       level:'Intermediate', rating:4.8, duration:'42h', price:'Paid',     url:'https://udemy.com' },
  { id:9,  title:'Docker & Kubernetes Guide',        platform:'Udemy',     type:'Course',        skill:'Docker',        level:'Intermediate', rating:4.7, duration:'23h', price:'Paid',     url:'https://udemy.com' },
  { id:10, title:'Google Cloud Professional',        platform:'Google',    type:'Certification', skill:'Cloud',         level:'Advanced',     rating:4.7, duration:'60h', price:'Paid',     url:'https://cloud.google.com' },
  { id:11, title:'Kaggle Learn & Competitions',      platform:'Kaggle',    type:'Practice',      skill:'Data Science',  level:'All',          rating:4.8, duration:'∞',   price:'Free',     url:'https://kaggle.com' },
  { id:12, title:'HackerRank Developer Skills',      platform:'HackerRank',type:'Practice',      skill:'Programming',   level:'All',          rating:4.6, duration:'∞',   price:'Free',     url:'https://hackerrank.com' },
];

/**
 * GET /api/resources
 * Returns learning resources, optionally filtered.
 */
router.get('/', async (req, res, next) => {
  try {
    const { type, skill, role, page = 1, limit = 20 } = req.query;

    if (getResourcesByRole && role) {
      const roleKey = role.toLowerCase().replace(/\s+/g, '_');
      const result = getResourcesByRole(roleKey);
      if (result && result.data) {
        return sendSuccess(res, 200, 'Resources retrieved', result.data);
      }
    }

    if (getResourcesBySkill && skill) {
      const result = getResourcesBySkill(skill.toLowerCase());
      if (result && result.data) {
        return sendSuccess(res, 200, 'Resources retrieved', result.data);
      }
    }

    // Static fallback with filtering
    let resources = [...STATIC_RESOURCES];
    if (type) resources = resources.filter(r => r.type.toLowerCase() === type.toLowerCase());
    if (skill) resources = resources.filter(r => r.skill.toLowerCase().includes(skill.toLowerCase()));

    const start = (page - 1) * limit;
    const paginated = resources.slice(start, start + Number(limit));

    return sendSuccess(res, 200, 'Resources retrieved', {
      resources: paginated,
      total: resources.length,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(resources.length / limit),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/resources/recommend
 * Get personalized resource recommendations.
 */
router.post('/recommend', async (req, res, next) => {
  try {
    const { skills = [], targetRole, userId } = req.body;

    if (recommendResources && targetRole) {
      const roleKey = targetRole.toLowerCase().replace(/\s+/g, '_');
      const result = recommendResources(skills.map(s => s.toLowerCase()), roleKey);
      if (result && result.data) {
        return sendSuccess(res, 200, 'Recommendations generated', result.data);
      }
    }

    // Fallback
    return sendSuccess(res, 200, 'Recommendations generated (basic)', {
      resources: STATIC_RESOURCES.slice(0, 6),
      note: 'Full recommendations require recommendation engine',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
