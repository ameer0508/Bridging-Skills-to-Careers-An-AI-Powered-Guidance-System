/**
 * Roadmap Controller
 * Handles HTTP request/response for roadmap generation endpoints.
 * Delegates all logic to roadmapService.
 */

const roadmapService = require('../services/roadmapService');
const { sendSuccess } = require('../utils/responseHelper');

/**
 * POST /api/roadmap
 * Generates a personalized learning roadmap.
 *
 * Body:
 *   { currentSkills: string[], targetRole: string }
 */
const generateRoadmap = async (req, res, next) => {
  try {
    const { currentSkills, targetRole } = req.body;

    const result = roadmapService.generateRoadmap(currentSkills, targetRole);

    return sendSuccess(res, 200, 'Roadmap generated successfully.', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/roadmap/roles
 * Returns all supported target roles.
 */
const getAvailableRoles = async (req, res, next) => {
  try {
    const roles = roadmapService.getAvailableRoles();
    return sendSuccess(res, 200, 'Available roles retrieved.', { roles });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateRoadmap, getAvailableRoles };
