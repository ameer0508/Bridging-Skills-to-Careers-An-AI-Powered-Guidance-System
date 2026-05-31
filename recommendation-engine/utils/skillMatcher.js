/**
 * skillMatcher.js
 * Utility functions for skill gap analysis and matching.
 * Compares a user's current skills against career requirements.
 */

'use strict';

const { loadDataset } = require('./dataLoader');

/**
 * Compute the missing skills for a user given their current skills
 * and a target career role.
 *
 * @param {string[]} userSkills   - Array of skill IDs the user already has
 * @param {string}   careerGoalId - Career goal ID, e.g. 'fullstack_developer'
 * @returns {{ missingRequired: string[], missingOptional: string[], allMissing: string[] }}
 */
function computeSkillGap(userSkills, careerGoalId) {
  const careers = loadDataset('careers');
  const career  = careers[careerGoalId];

  if (!career) {
    throw new Error(`Unknown career goal: "${careerGoalId}"`);
  }

  const userSet = new Set(userSkills.map(s => s.toLowerCase().trim()));

  const missingRequired = career.requiredSkills.filter(s => !userSet.has(s));
  const missingOptional = (career.optionalSkills || []).filter(s => !userSet.has(s));

  return {
    missingRequired,
    missingOptional,
    allMissing: [...missingRequired, ...missingOptional],
  };
}

/**
 * Calculate a skill match score (0–100) between a user's skills
 * and a career's required skills.
 *
 * @param {string[]} userSkills   - Array of skill IDs the user has
 * @param {string}   careerGoalId - Career goal ID
 * @returns {number} Score from 0 to 100
 */
function computeMatchScore(userSkills, careerGoalId) {
  const careers = loadDataset('careers');
  const career  = careers[careerGoalId];

  if (!career) return 0;

  const userSet  = new Set(userSkills.map(s => s.toLowerCase().trim()));
  const required = career.requiredSkills;
  const optional = career.optionalSkills || [];

  const requiredMatched = required.filter(s => userSet.has(s)).length;
  const optionalMatched = optional.filter(s => userSet.has(s)).length;

  // Required skills count for 80% of score, optional for 20%
  const requiredScore = required.length > 0
    ? (requiredMatched / required.length) * 80
    : 80;

  const optionalScore = optional.length > 0
    ? (optionalMatched / optional.length) * 20
    : 20;

  return Math.round(requiredScore + optionalScore);
}

/**
 * Validate that all provided skill IDs exist in the skills dataset.
 *
 * @param {string[]} skillIds - Array of skill IDs to validate
 * @returns {{ valid: string[], invalid: string[] }}
 */
function validateSkills(skillIds) {
  const skills = loadDataset('skills');
  const valid   = [];
  const invalid = [];

  skillIds.forEach(id => {
    const key = id.toLowerCase().trim();
    if (skills[key]) {
      valid.push(key);
    } else {
      invalid.push(id);
    }
  });

  return { valid, invalid };
}

/**
 * Get the priority weight of a skill for a given career goal.
 *
 * @param {string} skillId      - Skill ID
 * @param {string} careerGoalId - Career goal ID
 * @returns {number} Priority weight (0 if not relevant)
 */
function getSkillPriority(skillId, careerGoalId) {
  const careers = loadDataset('careers');
  const career  = careers[careerGoalId];
  if (!career || !career.skillPriorities) return 0;
  return career.skillPriorities[skillId] || 0;
}

module.exports = {
  computeSkillGap,
  computeMatchScore,
  validateSkills,
  getSkillPriority,
};
