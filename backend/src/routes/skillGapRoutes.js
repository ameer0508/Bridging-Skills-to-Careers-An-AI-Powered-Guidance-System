/**
 * Skill Gap Routes
 * Integrates with the recommendation engine for skill gap analysis.
 */
const express = require('express');
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Load recommendation engine services
let recommendResources, matchCareersToSkills, listCareers;
try {
  const resourceService = require('../../../recommendation-engine/services/resourceService');
  const careerService   = require('../../../recommendation-engine/services/careerService');
  recommendResources    = resourceService.recommendResources;
  matchCareersToSkills  = careerService.matchCareersToSkills;
  listCareers           = careerService.listCareers;
} catch (e) {
  console.warn('⚠️  Recommendation engine not available:', e.message);
}

/**
 * POST /api/skill-gap/analyze
 * Analyze skill gap for a user against a target role.
 */
router.post('/analyze',
  [
    body('skills').isArray().withMessage('skills must be an array'),
    body('targetRole').trim().notEmpty().withMessage('targetRole is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { skills, targetRole } = req.body;

      if (!recommendResources) {
        // Fallback: basic gap analysis without recommendation engine
        return sendSuccess(res, 200, 'Skill gap analysis complete (basic mode)', {
          targetRole,
          userSkills: skills,
          matchScore: Math.min(95, Math.round((skills.length / 10) * 100)),
          missingSkills: [],
          recommendations: [],
          note: 'Full AI analysis requires recommendation engine',
        });
      }

      // Normalize role name to engine format
      const roleKey = targetRole.toLowerCase().replace(/\s+/g, '_');
      const result = recommendResources(skills.map(s => s.toLowerCase()), roleKey);

      if (!result || result.status === 'error') {
        // Try career matching as fallback
        const matches = matchCareersToSkills(skills.map(s => s.toLowerCase()));
        return sendSuccess(res, 200, 'Career matches generated', {
          targetRole,
          userSkills: skills,
          careerMatches: matches.data || [],
          note: `Role "${targetRole}" not found. Showing career matches instead.`,
        });
      }

      return sendSuccess(res, 200, 'Skill gap analysis complete', result.data);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/skill-gap/careers
 * Get all supported career roles.
 */
router.get('/careers', async (req, res, next) => {
  try {
    if (!listCareers) {
      return sendSuccess(res, 200, 'Career roles', {
        careers: [
          'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
          'Data Analyst', 'Machine Learning Engineer', 'Cybersecurity Analyst',
          'Cloud Engineer', 'DevOps Engineer',
        ],
      });
    }
    const result = listCareers();
    return sendSuccess(res, 200, 'Career roles retrieved', result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/skill-gap/match
 * Match user skills to best career roles.
 */
router.post('/match',
  [body('skills').isArray().withMessage('skills must be an array')],
  validate,
  async (req, res, next) => {
    try {
      const { skills } = req.body;

      if (!matchCareersToSkills) {
        return sendSuccess(res, 200, 'Career matches (basic)', { matches: [] });
      }

      const result = matchCareersToSkills(skills.map(s => s.toLowerCase()));
      return sendSuccess(res, 200, 'Career matches generated', result.data);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
