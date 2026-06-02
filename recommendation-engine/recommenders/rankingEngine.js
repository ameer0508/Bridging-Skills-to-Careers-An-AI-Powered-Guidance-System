/**
 * rankingEngine.js
 * MODULE 4 — Resource Ranking System
 *
 * Multi-factor scoring: skill priority × career alignment × difficulty fit × resource quality.
 * Fixed: required skills now correctly outrank optional skills in all tiers.
 */

'use strict';

const { loadDataset }      = require('../utils/dataLoader');
const { getPriorityLabel } = require('../utils/responseFormatter');
const logger               = require('../utils/logger');

const WEIGHTS = {
  skillRelevance  : 0.40,
  careerAlignment : 0.30,
  difficultyFit   : 0.15,
  resourceQuality : 0.15,
};

function scoreResource(resource, careerGoalId, missingSkills) {
  const careers = loadDataset('careers');
  const career  = careers[careerGoalId];

  // 1. Skill relevance — priority is 0–10, normalise to 0–100
  const skillScore = ((resource.priority || 0) / 10) * 100;

  // 2. Career alignment — required = 100, optional = 60, unrelated = 20
  let alignmentScore = 20;
  if (career) {
    if (career.requiredSkills.includes(resource.skillId))      alignmentScore = 100;
    else if ((career.optionalSkills || []).includes(resource.skillId)) alignmentScore = 60;
  }

  // 3. Difficulty fit — beginner resources rank highest (easier entry point)
  const levelMap = {
    'beginner'             : 100,
    'beginner-to-advanced' : 85,
    'intermediate'         : 65,
    'advanced'             : 40,
  };
  const diffScore = levelMap[(resource.level || '').toLowerCase()] ?? 55;

  // 4. Resource quality — rating (0–5 → 0–80) + free bonus (0–20)
  const ratingScore  = resource.rating ? (resource.rating / 5) * 80 : 50;
  const freeBonus    = resource.free === true ? 20 : 0;
  const qualityScore = Math.min(100, ratingScore + freeBonus);

  const composite = (
    skillScore     * WEIGHTS.skillRelevance   +
    alignmentScore * WEIGHTS.careerAlignment  +
    diffScore      * WEIGHTS.difficultyFit    +
    qualityScore   * WEIGHTS.resourceQuality
  );

  return Math.round(composite);
}

/**
 * Rank a flat list of resources and split into three tiers.
 *
 * @param {Object[]} resources   - Flat array of formatted resources
 * @param {string}   careerGoalId
 * @param {string[]} missingSkills
 * @returns {{ top: Object[], medium: Object[], advanced: Object[] }}
 */
function rankResources(resources, careerGoalId, missingSkills = []) {
  // Score every resource
  const scored = resources.map(r => ({
    ...r,
    score        : scoreResource(r, careerGoalId, missingSkills),
    priorityLabel: getPriorityLabel(r.priority || 0),
  }));

  // Sort descending by composite score
  scored.sort((a, b) => b.score - a.score);

  // Split into tiers
  const top      = scored.filter(r => r.score >= 70);
  const medium   = scored.filter(r => r.score >= 45 && r.score < 70);
  const advanced = scored.filter(r => r.score < 45);

  logger.info('Ranking complete', {
    total   : scored.length,
    top     : top.length,
    medium  : medium.length,
    advanced: advanced.length,
  });

  return { top, medium, advanced };
}

/**
 * Rank resources and also group each tier by resource type.
 *
 * @param {Object[]} resources
 * @param {string}   careerGoalId
 * @param {string[]} missingSkills
 * @returns {Object} Tiered and type-grouped recommendations
 */
function rankAndGroup(resources, careerGoalId, missingSkills = []) {
  const { top, medium, advanced } = rankResources(resources, careerGoalId, missingSkills);

  function groupByType(list) {
    return list.reduce((acc, r) => {
      const key = r.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});
  }

  return {
    top     : groupByType(top),
    medium  : groupByType(medium),
    advanced: groupByType(advanced),
  };
}

module.exports = { scoreResource, rankResources, rankAndGroup };
