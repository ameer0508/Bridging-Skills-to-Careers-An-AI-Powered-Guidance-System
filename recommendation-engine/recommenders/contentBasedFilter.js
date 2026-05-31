/**
 * contentBasedFilter.js
 * MODULE 3 — Content-Based Filtering
 *
 * Filters the skills database to return only resources that are
 * directly relevant to the user's missing skills and career goal.
 * Irrelevant resources are never included in the output.
 */

'use strict';

const { loadDataset }    = require('../utils/dataLoader');
const { getSkillPriority } = require('../utils/skillMatcher');
const { formatResource } = require('../utils/responseFormatter');
const logger             = require('../utils/logger');

/**
 * Filter and collect all resources for a given set of skill IDs.
 * Only resources belonging to the requested skills are returned —
 * this is the core content-based filtering guarantee.
 *
 * @param {string[]} skillIds     - Skills to fetch resources for
 * @param {string}   careerGoalId - Used to weight priority scores
 * @returns {Object[]} Flat array of formatted resource objects
 */
function filterResourcesBySkills(skillIds, careerGoalId) {
  const skills = loadDataset('skills');
  const results = [];

  skillIds.forEach(skillId => {
    const skill = skills[skillId];

    if (!skill) {
      logger.warn('Skill not found in database', { skillId });
      return;
    }

    const priority = getSkillPriority(skillId, careerGoalId);

    logger.debug('Filtering resources for skill', { skillId, priority });

    // Courses
    (skill.courses || []).forEach(course => {
      results.push(formatResource(course, 'course', skillId, priority));
    });

    // Certifications
    (skill.certifications || []).forEach(cert => {
      results.push(formatResource(cert, 'certification', skillId, priority));
    });

    // Practice Platforms
    (skill.practicePlatforms || []).forEach(platform => {
      results.push(formatResource(platform, 'practicePlatform', skillId, priority));
    });

    // Documentation
    (skill.documentation || []).forEach(doc => {
      results.push(formatResource(doc, 'documentation', skillId, priority));
    });
  });

  logger.info('Content-based filtering complete', {
    skillCount   : skillIds.length,
    resourceCount: results.length,
  });

  return results;
}

/**
 * Filter resources for a single skill.
 *
 * @param {string} skillId      - Skill ID
 * @param {string} careerGoalId - Career goal for priority weighting
 * @returns {Object} Resources grouped by type for this skill
 */
function filterResourcesByOneSkill(skillId, careerGoalId = null) {
  const skills = loadDataset('skills');
  const skill  = skills[skillId];

  if (!skill) {
    throw new Error(`Skill not found: "${skillId}"`);
  }

  const priority = careerGoalId ? getSkillPriority(skillId, careerGoalId) : 5;

  return {
    skillId,
    skillName: skill.name,
    courses         : (skill.courses || []).map(r => formatResource(r, 'course', skillId, priority)),
    certifications  : (skill.certifications || []).map(r => formatResource(r, 'certification', skillId, priority)),
    practicePlatforms: (skill.practicePlatforms || []).map(r => formatResource(r, 'practicePlatform', skillId, priority)),
    documentation   : (skill.documentation || []).map(r => formatResource(r, 'documentation', skillId, priority)),
  };
}

module.exports = { filterResourcesBySkills, filterResourcesByOneSkill };
