/**
 * careerService.js
 * MODULE 2 — Career Goal Mapping
 *
 * Provides career goal lookup, skill mapping, and learning
 * sequence retrieval for all supported roles.
 */

'use strict';

const { loadDataset }                = require('../utils/dataLoader');
const { computeMatchScore }          = require('../utils/skillMatcher');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger                         = require('../utils/logger');

/**
 * List all supported career goals.
 *
 * @returns {Object} API response with array of career summaries
 */
function listCareers() {
  try {
    const careers = loadDataset('careers');

    const list = Object.values(careers).map(c => ({
      id             : c.id,
      title          : c.title,
      description    : c.description,
      demandLevel    : c.demandLevel,
      requiredSkills : c.requiredSkills,
      optionalSkills : c.optionalSkills || [],
      totalSkills    : c.requiredSkills.length + (c.optionalSkills || []).length,
    }));

    return successResponse(list, `${list.length} career goals available`);
  } catch (err) {
    logger.error('listCareers failed', { error: err.message });
    return errorResponse(err.message, 500);
  }
}

/**
 * Get full details for a single career goal.
 *
 * @param {string} careerGoalId
 * @returns {Object} API response with career details
 */
function getCareerDetails(careerGoalId) {
  try {
    const careers = loadDataset('careers');
    const career  = careers[careerGoalId];

    if (!career) {
      return errorResponse(`Career goal not found: "${careerGoalId}"`, 404);
    }

    return successResponse(career, `Details for: ${career.title}`);
  } catch (err) {
    logger.error('getCareerDetails failed', { error: err.message });
    return errorResponse(err.message, 500);
  }
}

/**
 * Get the recommended learning sequence for a career goal.
 *
 * @param {string} careerGoalId
 * @returns {Object} API response with ordered skill sequence
 */
function getLearningSequence(careerGoalId) {
  try {
    const careers = loadDataset('careers');
    const skills  = loadDataset('skills');
    const career  = careers[careerGoalId];

    if (!career) {
      return errorResponse(`Career goal not found: "${careerGoalId}"`, 404);
    }

    const sequence = (career.learningSequence || []).map((skillId, index) => {
      const skill = skills[skillId];
      return {
        order           : index + 1,
        skillId,
        skillName       : skill ? skill.name : skillId,
        difficultyLevel : skill ? skill.difficultyLevel : null,
        durationWeeks   : skill ? skill.learningDurationWeeks : null,
        priority        : career.skillPriorities?.[skillId] || 0,
      };
    });

    return successResponse(
      { careerGoalId, careerTitle: career.title, sequence },
      `Learning sequence for: ${career.title}`
    );
  } catch (err) {
    logger.error('getLearningSequence failed', { error: err.message });
    return errorResponse(err.message, 500);
  }
}

/**
 * Given a user's skills, find the best-matching career goals.
 *
 * @param {string[]} userSkills - Array of skill IDs the user has
 * @returns {Object} API response with ranked career matches
 */
function matchCareersToSkills(userSkills) {
  try {
    if (!Array.isArray(userSkills) || userSkills.length === 0) {
      return errorResponse('userSkills must be a non-empty array');
    }

    const careers = loadDataset('careers');

    const matches = Object.values(careers).map(career => ({
      id         : career.id,
      title      : career.title,
      description: career.description,
      demandLevel: career.demandLevel,
      matchScore : computeMatchScore(userSkills, career.id),
    }));

    matches.sort((a, b) => b.matchScore - a.matchScore);

    return successResponse(matches, 'Career matches ranked by skill alignment');
  } catch (err) {
    logger.error('matchCareersToSkills failed', { error: err.message });
    return errorResponse(err.message, 500);
  }
}

module.exports = {
  listCareers,
  getCareerDetails,
  getLearningSequence,
  matchCareersToSkills,
};
