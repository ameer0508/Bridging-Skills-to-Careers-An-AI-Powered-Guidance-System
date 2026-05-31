/**
 * skillService.js
 * MODULE 1 — Skill Resource Database Access
 *
 * Provides lookup and search functions over the skills dataset.
 */

'use strict';

const { loadDataset }                    = require('../utils/dataLoader');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger                             = require('../utils/logger');

/**
 * List all skills in the database.
 *
 * @param {string} [category] - Optional filter by category
 * @returns {Object} API response with skill summaries
 */
function listSkills(category = null) {
  try {
    const skills = loadDataset('skills');

    let list = Object.values(skills).map(s => ({
      id              : s.id,
      name            : s.name,
      category        : s.category,
      difficultyLevel : s.difficultyLevel,
      durationWeeks   : s.learningDurationWeeks,
      tags            : s.tags || [],
      courseCount     : (s.courses || []).length,
      certCount       : (s.certifications || []).length,
    }));

    if (category) {
      list = list.filter(s => s.category === category.toLowerCase());
    }

    return successResponse(list, `${list.length} skills found`);
  } catch (err) {
    logger.error('listSkills failed', { error: err.message });
    return errorResponse(err.message, 500);
  }
}

/**
 * Get full details for a single skill including all resources.
 *
 * @param {string} skillId
 * @returns {Object} API response with full skill data
 */
function getSkillDetails(skillId) {
  try {
    const skills = loadDataset('skills');
    const skill  = skills[skillId?.toLowerCase()?.trim()];

    if (!skill) {
      return errorResponse(`Skill not found: "${skillId}"`, 404);
    }

    return successResponse(skill, `Details for: ${skill.name}`);
  } catch (err) {
    logger.error('getSkillDetails failed', { error: err.message });
    return errorResponse(err.message, 500);
  }
}

/**
 * Search skills by name or tag (case-insensitive partial match).
 *
 * @param {string} query - Search term
 * @returns {Object} API response with matching skills
 */
function searchSkills(query) {
  try {
    if (!query || query.trim().length < 2) {
      return errorResponse('Search query must be at least 2 characters');
    }

    const skills = loadDataset('skills');
    const q      = query.toLowerCase().trim();

    const matches = Object.values(skills).filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)   ||
      (s.tags || []).some(t => t.toLowerCase().includes(q))
    );

    return successResponse(
      matches.map(s => ({ id: s.id, name: s.name, category: s.category, tags: s.tags })),
      `${matches.length} skills matched "${query}"`
    );
  } catch (err) {
    logger.error('searchSkills failed', { error: err.message });
    return errorResponse(err.message, 500);
  }
}

/**
 * Get all available skill categories.
 *
 * @returns {Object} API response with unique categories
 */
function getCategories() {
  try {
    const skills     = loadDataset('skills');
    const categories = [...new Set(Object.values(skills).map(s => s.category))].sort();
    return successResponse(categories, `${categories.length} categories`);
  } catch (err) {
    logger.error('getCategories failed', { error: err.message });
    return errorResponse(err.message, 500);
  }
}

module.exports = { listSkills, getSkillDetails, searchSkills, getCategories };
