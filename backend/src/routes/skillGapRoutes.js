/**
 * Skill Gap Routes — powered by real AI engine
 */
const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { sendSuccess } = require('../utils/responseHelper');
const { AppError } = require('../middleware/errorHandler');
const aiClient = require('../utils/aiClient');

const router = express.Router();

// POST /api/skill-gap/analyze
router.post('/analyze',
  [
    body('skills').isArray().withMessage('skills must be an array'),
    body('targetRole').trim().notEmpty().withMessage('targetRole is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { skills, targetRole } = req.body;
      const result = await aiClient.analyzeSkillGap(skills, targetRole);
      if (result.data?.error || result.error) {
        throw new AppError(result.data?.error || result.error, 400);
      }
      return sendSuccess(res, 200, 'Skill gap analysis complete', result.data || result);
    } catch (err) { next(err); }
  }
);

// POST /api/skill-gap/match
router.post('/match',
  [body('skills').isArray().withMessage('skills must be an array')],
  validate,
  async (req, res, next) => {
    try {
      const { skills } = req.body;
      const result = await aiClient.matchCareers(skills);
      return sendSuccess(res, 200, 'Career matches generated', result.data || result);
    } catch (err) { next(err); }
  }
);

// POST /api/skill-gap/readiness
router.post('/readiness',
  [body('skills').isArray(), body('targetRole').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { skills, targetRole, hasResume = false, roadmapProgress = 0 } = req.body;
      const result = await aiClient.computeReadiness(skills, targetRole, hasResume, roadmapProgress);
      return sendSuccess(res, 200, 'Readiness score computed', result.data || result);
    } catch (err) { next(err); }
  }
);

// GET /api/skill-gap/careers
router.get('/careers', async (req, res, next) => {
  try {
    const result = await aiClient.getRoles();
    return sendSuccess(res, 200, 'Career roles retrieved', result.data || result);
  } catch (err) { next(err); }
});

// POST /api/skill-gap/interview-questions
router.post('/interview-questions',
  [body('targetRole').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { targetRole, count = 5 } = req.body;
      const result = await aiClient.interviewQuestions(targetRole, count);
      return sendSuccess(res, 200, 'Interview questions generated', result.data || result);
    } catch (err) { next(err); }
  }
);

module.exports = router;
