/**
 * Roadmap Routes
 * Defines endpoints for roadmap generation and role discovery.
 */

const express = require('express');
const { body } = require('express-validator');
const roadmapController = require('../controllers/roadmapController');
const validate = require('../middleware/validate');
const { getSupportedRoles } = require('../utils/roadmapData');

const router = express.Router();

// ── Validation Rules ───────────────────────────────────────────────────────────

const generateRoadmapRules = [
  body('targetRole')
    .trim()
    .notEmpty().withMessage('Target role is required.')
    .isString().withMessage('Target role must be a string.')
    .custom((value) => {
      const supported = getSupportedRoles();
      const match = supported.find(
        (role) => role.toLowerCase() === value.toLowerCase().trim()
      );
      if (!match) {
        throw new Error(
          `Unsupported role. Supported roles: ${supported.join(', ')}`
        );
      }
      return true;
    }),

  body('currentSkills')
    .optional()
    .isArray().withMessage('currentSkills must be an array.')
    .custom((arr) => arr.length <= 100).withMessage('currentSkills cannot exceed 100 items.'),

  body('currentSkills.*')
    .optional()
    .isString().withMessage('Each skill must be a string.')
    .trim()
    .notEmpty().withMessage('Skill entries cannot be empty strings.'),
];

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/roadmap/roles
 * @desc    Get all supported target roles
 * @access  Public
 */
router.get('/roles', roadmapController.getAvailableRoles);

/**
 * @route   POST /api/roadmap
 * @desc    Generate a personalized learning roadmap
 * @access  Public
 * @body    { currentSkills: string[], targetRole: string }
 */
router.post('/', generateRoadmapRules, validate, roadmapController.generateRoadmap);

module.exports = router;
