/**
 * resourceService.js
 * MODULE 6 — API-Ready Functions
 *
 * Provides the primary public API of the recommendation engine.
 * All functions return clean JSON-serialisable objects.
 *
 * Exported functions:
 *   getResourcesBySkill(skillId, careerGoalId?)
 *   getResourcesByRole(careerGoalId)
 *   recommendResources(userSkills, careerGoalId)
 *   generateRecommendations(userProfile)
 */

'use strict';

const { loadDataset }                          = require('../utils/dataLoader');
const { computeSkillGap, computeMatchScore, validateSkills } = require('../utils/skillMatcher');
const { filterResourcesBySkills, filterResourcesByOneSkill } = require('../recommenders/contentBasedFilter');
const { rankAndGroup }                         = require('../recommenders/rankingEngine');
const { successResponse, errorResponse }       = require('../utils/responseFormatter');
const logger                                   = require('../utils/logger');

// ─────────────────────────────────────────────────────────────
// getResourcesBySkill
// ─────────────────────────────────────────────────────────────

/**
 * Retrieve all learning resources for a specific skill.
 *
 * @param {string}  skillId      - e.g. 'react', 'python'
 * @param {string}  [careerGoalId] - Optional, used for priority weighting
 * @returns {Object} API response with resources grouped by type
 */
function getResourcesBySkill(skillId, careerGoalId = null) {
  try {
    if (!skillId) {
      return errorResponse('skillId is required');
    }

    const normalised = skillId.toLowerCase().trim();
    const skills     = loadDataset('skills');

    if (!skills[normalised]) {
      return errorResponse(`Skill not found: "${skillId}"`, 404);
    }

    const result = filterResourcesByOneSkill(normalised, careerGoalId);

    logger.info('getResourcesBySkill', { skillId: normalised, careerGoalId });

    return successResponse(result, `Resources for skill: ${skills[normalised].name}`);
  } catch (err) {
    logger.error('getResourcesBySkill failed', { error: err.message });
    return errorResponse(err.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────
// getResourcesByRole
// ─────────────────────────────────────────────────────────────

/**
 * Retrieve all recommended resources for a career role.
 * Returns resources for every required + optional skill of that role.
 *
 * @param {string} careerGoalId - e.g. 'fullstack_developer'
 * @returns {Object} API response with ranked resources
 */
function getResourcesByRole(careerGoalId) {
  try {
    if (!careerGoalId) {
      return errorResponse('careerGoalId is required');
    }

    const careers = loadDataset('careers');
    const career  = careers[careerGoalId];

    if (!career) {
      return errorResponse(`Career goal not found: "${careerGoalId}"`, 404);
    }

    const allSkills  = [...career.requiredSkills, ...(career.optionalSkills || [])];
    const resources  = filterResourcesBySkills(allSkills, careerGoalId);
    const ranked     = rankAndGroup(resources, careerGoalId, allSkills);

    const payload = {
      careerGoal    : career.title,
      careerGoalId,
      requiredSkills: career.requiredSkills,
      optionalSkills: career.optionalSkills || [],
      learningSequence: career.learningSequence || [],
      recommendations: ranked,
      totalResources : resources.length,
    };

    logger.info('getResourcesByRole', { careerGoalId, totalResources: resources.length });

    return successResponse(payload, `Resources for role: ${career.title}`);
  } catch (err) {
    logger.error('getResourcesByRole failed', { error: err.message });
    return errorResponse(err.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────
// recommendResources
// ─────────────────────────────────────────────────────────────

/**
 * Core recommendation function.
 * Given a user's current skills and career goal, returns resources
 * targeted only at the skills the user is missing.
 *
 * @param {string[]} userSkills   - Skills the user already has
 * @param {string}   careerGoalId - Target career role
 * @returns {Object} API response with gap analysis + ranked recommendations
 */
function recommendResources(userSkills, careerGoalId) {
  try {
    // Input validation
    if (!Array.isArray(userSkills)) {
      return errorResponse('userSkills must be an array of skill IDs');
    }
    if (!careerGoalId) {
      return errorResponse('careerGoalId is required');
    }

    const careers = loadDataset('careers');
    if (!careers[careerGoalId]) {
      return errorResponse(`Career goal not found: "${careerGoalId}"`, 404);
    }

    // Validate skill IDs
    const { valid: validSkills, invalid: invalidSkills } = validateSkills(userSkills);
    if (invalidSkills.length > 0) {
      logger.warn('Some skill IDs were not recognised', { invalidSkills });
    }

    // Compute skill gap
    const gap = computeSkillGap(validSkills, careerGoalId);

    if (gap.allMissing.length === 0) {
      return successResponse({
        careerGoalId,
        matchScore      : 100,
        missingSkills   : [],
        recommendations : { top: {}, medium: {}, advanced: {} },
        message         : 'User already has all required skills for this role!',
      }, 'No skill gaps detected');
    }

    // Filter resources only for missing skills (content-based filtering)
    const resources = filterResourcesBySkills(gap.allMissing, careerGoalId);

    // Rank and group
    const ranked = rankAndGroup(resources, careerGoalId, gap.allMissing);

    // Match score
    const matchScore = computeMatchScore(validSkills, careerGoalId);

    const payload = {
      careerGoalId,
      careerTitle     : careers[careerGoalId].title,
      matchScore,
      userSkills      : validSkills,
      invalidSkills,
      skillGap        : {
        missingRequired: gap.missingRequired,
        missingOptional: gap.missingOptional,
        totalMissing   : gap.allMissing.length,
      },
      recommendations : ranked,
      totalResources  : resources.length,
    };

    logger.info('recommendResources', {
      careerGoalId,
      matchScore,
      missingCount: gap.allMissing.length,
      resourceCount: resources.length,
    });

    return successResponse(payload);
  } catch (err) {
    logger.error('recommendResources failed', { error: err.message });
    return errorResponse(err.message, 500);
  }
}

// ─────────────────────────────────────────────────────────────
// generateRecommendations
// ─────────────────────────────────────────────────────────────

/**
 * MODULE 5 — Resource Response Engine
 * Full recommendation pipeline from a user profile object.
 *
 * @param {Object} userProfile
 * @param {string}   userProfile.userId      - Optional user identifier
 * @param {string[]} userProfile.currentSkills - Skills the user has
 * @param {string}   userProfile.careerGoal  - Target career role ID
 * @param {string}   [userProfile.name]      - Optional user name
 * @returns {Object} Complete structured recommendation response
 */
function generateRecommendations(userProfile) {
  try {
    const { userId, currentSkills, careerGoal, name } = userProfile || {};

    if (!currentSkills || !careerGoal) {
      return errorResponse('userProfile must include currentSkills and careerGoal');
    }

    const careers      = loadDataset('careers');
    const learningPaths = loadDataset('learning_paths');

    const career = careers[careerGoal];
    if (!career) {
      return errorResponse(`Career goal not found: "${careerGoal}"`, 404);
    }

    // Core recommendation
    const coreResult = recommendResources(currentSkills, careerGoal);
    if (!coreResult.success) return coreResult;

    const core = coreResult.data;

    // Find matching learning path
    const learningPath = Object.values(learningPaths).find(
      p => p.targetRole === careerGoal
    ) || null;

    // Build the final structured response (Module 5 format)
    const response = {
      user: {
        userId : userId || null,
        name   : name   || null,
        currentSkills: core.userSkills,
      },
      careerGoal: {
        id          : careerGoal,
        title       : career.title,
        description : career.description,
        demandLevel : career.demandLevel,
        matchScore  : core.matchScore,
      },
      skillGap: core.skillGap,
      recommendations: {
        // Top priority — start here
        courses: [
          ...(core.recommendations.top.course    || []),
          ...(core.recommendations.medium.course || []),
        ].map(r => ({
          title   : r.title,
          provider: r.provider,
          url     : r.url,
          free    : r.free,
          level   : r.level,
          duration: r.duration,
          rating  : r.rating,
          skillId : r.skillId,
          priority: r.priorityLabel,
          score   : r.score,
        })),

        certifications: [
          ...(core.recommendations.top.certification    || []),
          ...(core.recommendations.medium.certification || []),
        ].map(r => ({
          title   : r.title,
          provider: r.provider,
          url     : r.url,
          level   : r.level,
          duration: r.duration,
          skillId : r.skillId,
          priority: r.priorityLabel,
          score   : r.score,
        })),

        practicePlatforms: [
          ...(core.recommendations.top.practicePlatform    || []),
          ...(core.recommendations.medium.practicePlatform || []),
        ].map(r => ({
          title   : r.title,
          url     : r.url,
          free    : r.free,
          type    : r.provider,
          skillId : r.skillId,
          priority: r.priorityLabel,
          score   : r.score,
        })),

        documentation: [
          ...(core.recommendations.top.documentation    || []),
          ...(core.recommendations.medium.documentation || []),
        ].map(r => ({
          title   : r.title,
          url     : r.url,
          type    : r.provider,
          skillId : r.skillId,
          priority: r.priorityLabel,
          score   : r.score,
        })),

        advanced: core.recommendations.advanced,
      },
      learningPath: learningPath
        ? {
            title      : learningPath.title,
            totalWeeks : learningPath.totalWeeks,
            phases     : learningPath.phases,
          }
        : null,
      meta: {
        generatedAt   : new Date().toISOString(),
        engineVersion : '1.0.0',
        totalResources: core.totalResources,
      },
    };

    logger.info('generateRecommendations complete', {
      userId    : userId || 'anonymous',
      careerGoal,
      matchScore: core.matchScore,
    });

    return successResponse(response, `Recommendations generated for ${career.title}`);
  } catch (err) {
    logger.error('generateRecommendations failed', { error: err.message });
    return errorResponse(err.message, 500);
  }
}

module.exports = {
  getResourcesBySkill,
  getResourcesByRole,
  recommendResources,
  generateRecommendations,
};
